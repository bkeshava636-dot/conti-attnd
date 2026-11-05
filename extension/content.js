/**
 * Contineo Attendance Collector - Content Script
 * Extracts student attendance data from BITM Contineo Proctor SIMS portal.
 */

(function () {
  'use strict';

  // Regular expressions for data validation
  const USN_REGEX = /\b([1-4][A-Z0-9]{2}\d{2}[A-Z0-9]{2,3}\d{2,3})\b/i;
  const COURSE_CODE_REGEX = /\b([0-9][A-Z]{2,4}[0-9]{3}[A-Z0-9]*)\b/i;

  /**
   * Main extraction engine
   */
  function extractAllStudents(doc = document) {
    const report = {
      timestamp: new Date().toISOString(),
      pageTitle: doc.title,
      url: typeof window !== 'undefined' ? window.location?.href || '' : (doc.defaultView?.location?.href || ''),
      totalDetected: 0,
      students: [],
      errors: [],
      warnings: []
    };

    try {
      // Find all candidate attendance tables on the page
      const allTables = Array.from(doc.querySelectorAll('table'));
      const attendanceTables = allTables.filter(table => isAttendanceTable(table));

      if (attendanceTables.length === 0) {
        // Fallback: Check if there are container sections marked as student-section or similar
        const studentSections = Array.from(doc.querySelectorAll('.student-section, [data-usn], .counselling-student-card'));
        if (studentSections.length > 0) {
          studentSections.forEach((section, index) => {
            const student = extractFromStudentContainer(section, index + 1);
            if (student) {
              report.students.push(student);
            }
          });
        } else {
          report.warnings.push('No attendance tables or student containers found on page.');
        }
      } else {
        // Primary strategy: Process each attendance table and map to its student context
        attendanceTables.forEach((table, index) => {
          try {
            const studentData = parseStudentFromTableContext(table, doc, index + 1);
            if (studentData && studentData.usn) {
              report.students.push(studentData);
            } else {
              report.errors.push({
                index: index + 1,
                error: 'Could not associate attendance table with a valid student USN'
              });
            }
          } catch (err) {
            report.errors.push({
              index: index + 1,
              error: `Table parse error: ${err.message}`
            });
          }
        });
      }

      // Deduplicate students by USN if needed
      const seenUSNs = new Set();
      const uniqueStudents = [];
      const duplicateUSNs = [];

      report.students.forEach(s => {
        if (seenUSNs.has(s.usn)) {
          duplicateUSNs.push(s.usn);
        } else {
          seenUSNs.add(s.usn);
          uniqueStudents.push(s);
        }
      });

      if (duplicateUSNs.length > 0) {
        report.warnings.push(`Deduplicated ${duplicateUSNs.length} repeated student record(s): ${duplicateUSNs.join(', ')}`);
      }

      report.students = uniqueStudents;
      report.totalDetected = uniqueStudents.length;

    } catch (globalErr) {
      report.errors.push({
        index: 0,
        error: `Extraction aborted: ${globalErr.message}`
      });
    }

    return report;
  }

  function getNodeText(node) {
    if (!node) return '';
    return (node.innerText !== undefined ? node.innerText : node.textContent) || '';
  }

  /**
   * Determine if a <table> is an attendance table
   */
  function isAttendanceTable(table) {
    if (table.getAttribute('data-type') === 'attendance-table') return true;
    const headerEl = table.querySelector('thead') || table.rows[0] || table;
    const headerText = getNodeText(headerEl);
    const upper = headerText.toUpperCase();
    return upper.includes('ATTENDANCE') && (upper.includes('COURSE') || upper.includes('CODE') || upper.includes('CIE'));
  }

  /**
   * Parse a student section given its attendance table
   */
  function parseStudentFromTableContext(table, doc, index) {
    // 1. First search enclosing container
    let container = table.closest('.student-section, [data-usn], .panel, .card, .box, fieldset');
    
    // 2. Extract USN, Name, Semester
    let usn = '';
    let name = '';
    let semester = 'SEM03';

    if (container) {
      usn = container.getAttribute('data-usn') || '';
      const containerText = getNodeText(container);
      
      if (!usn) {
        const match = containerText.match(/USN\s*[:\-]?\s*([1-4][A-Z0-9]{2}\d{2}[A-Z0-9]{2,3}\d{2,3})/i);
        if (match) {
          usn = match[1].toUpperCase();
        } else {
          const generalMatch = containerText.match(USN_REGEX);
          if (generalMatch) usn = generalMatch[1].toUpperCase();
        }
      }

      const nameEl = container.querySelector('.student-name, h3, h4, .name');
      if (nameEl) {
        name = getNodeText(nameEl).trim();
      }

      const semMatch = containerText.match(/Semester\s*[:\-]?\s*(SEM\d+|\d+(?:st|nd|rd|th)?\s*Sem)/i);
      if (semMatch) {
        semester = semMatch[1].toUpperCase();
      }
    }

    // 3. If container search didn't yield USN, walk backwards in DOM from table
    if (!usn) {
      const precedingText = getPrecedingText(table, 1500);
      const usnMatch = precedingText.match(/USN\s*[:\-]?\s*([1-4][A-Z0-9]{2}\d{2}[A-Z0-9]{2,3}\d{2,3})/i) || precedingText.match(USN_REGEX);
      if (usnMatch) {
        usn = usnMatch[1].toUpperCase();
      }
    }

    // Fallback name if missing
    if (!name && usn) {
      name = `Student (${usn})`;
    }

    // 4. Parse rows of the table
    const subjects = parseAttendanceRows(table);

    // Compute student aggregate
    const overallPercentage = subjects.length > 0
      ? Math.round((subjects.reduce((sum, s) => sum + s.attendance_percentage, 0) / subjects.length) * 10) / 10
      : 0;

    return {
      usn,
      name,
      semester,
      totalSubjects: subjects.length,
      overallPercentage,
      subjects
    };
  }

  /**
   * Extract rows from the attendance table
   */
  function parseAttendanceRows(table) {
    const subjects = [];
    const rows = Array.from(table.querySelectorAll('tr'));
    if (rows.length === 0) return subjects;

    // Detect column indices
    let codeCol = 0;
    let cieCol = 1;
    let attCol = 2;

    const headerRow = table.querySelector('thead tr') || rows[0];
    const headerCells = Array.from(headerRow.querySelectorAll('th, td'));

    if (headerCells.length >= 2) {
      headerCells.forEach((cell, idx) => {
        const text = getNodeText(cell).toUpperCase();
        if (text.includes('COURSE') || text.includes('CODE') || text.includes('SUBJECT')) {
          codeCol = idx;
        } else if (text.includes('CIE') || text.includes('INTERNAL') || text.includes('MARKS')) {
          cieCol = idx;
        } else if (text.includes('ATTENDANCE') || text.includes('%') || text.includes('PRESENCE')) {
          attCol = idx;
        }
      });
    }

    // Parse data rows (skipping header row)
    const dataRows = rows.filter(r => r !== headerRow && !r.closest('thead'));

    dataRows.forEach(row => {
      const cells = Array.from(row.querySelectorAll('td'));
      if (cells.length <= Math.max(codeCol, attCol)) return;

      const codeRaw = getNodeText(cells[codeCol]).trim();
      const cieRaw = getNodeText(cells[cieCol]).trim();
      const attRaw = getNodeText(cells[attCol]).trim();

      // Clean course code
      const codeMatch = codeRaw.match(COURSE_CODE_REGEX);
      const courseCode = codeMatch ? codeMatch[1].toUpperCase() : codeRaw.replace(/[^A-Za-z0-9]/g, '').toUpperCase();

      // Clean attendance percentage
      let percentage = null;
      const numMatch = attRaw.match(/(\d+(?:\.\d+)?)/);
      if (numMatch) {
        percentage = parseFloat(numMatch[1]);
        // Validate range 0 - 100
        if (percentage >= 0 && percentage <= 100) {
          percentage = Math.round(percentage * 10) / 10;
        } else {
          percentage = null;
        }
      }

      if (courseCode && percentage !== null) {
        subjects.push({
          course_code: courseCode,
          cie: cieRaw || 'N/A',
          attendance_percentage: percentage
        });
      }
    });

    return subjects;
  }

  /**
   * Helper to parse directly from a student container
   */
  function extractFromStudentContainer(container, index) {
    let usn = container.getAttribute('data-usn') || '';
    const text = getNodeText(container);
    if (!usn) {
      const match = text.match(/USN\s*[:\-]?\s*([1-4][A-Z0-9]{2}\d{2}[A-Z0-9]{2,3}\d{2,3})/i) || text.match(USN_REGEX);
      if (match) usn = match[1].toUpperCase();
    }

    if (!usn) return null;

    const nameEl = container.querySelector('.student-name, h3, h4, .name');
    const name = nameEl ? getNodeText(nameEl).trim() : `Student (${usn})`;

    let semester = 'SEM03';
    const semMatch = text.match(/Semester\s*[:\-]?\s*(SEM\d+|\d+(?:st|nd|rd|th)?\s*Sem)/i);
    if (semMatch) semester = semMatch[1].toUpperCase();

    const table = container.querySelector('table');
    const subjects = table ? parseAttendanceRows(table) : [];

    const overallPercentage = subjects.length > 0
      ? Math.round((subjects.reduce((sum, s) => sum + s.attendance_percentage, 0) / subjects.length) * 10) / 10
      : 0;

    return {
      usn,
      name,
      semester,
      totalSubjects: subjects.length,
      overallPercentage,
      subjects
    };
  }

  /**
   * Walk backwards through text content
   */
  function getPrecedingText(node, maxChars = 1000) {
    let text = '';
    let curr = node.previousSibling || node.parentElement;
    while (curr && text.length < maxChars) {
      text = getNodeText(curr) + ' ' + text;
      curr = curr.previousSibling || curr.parentElement;
    }
    return text;
  }

  // Chrome Extension Messaging Interface
  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.action === 'PING') {
        sendResponse({ status: 'PONG', ready: true });
        return true;
      }

      if (message.action === 'DETECT_STUDENTS') {
        const result = extractAllStudents(document);
        sendResponse({
          success: true,
          count: result.students.length,
          pageTitle: result.pageTitle,
          warning: result.warnings.length > 0 ? result.warnings[0] : null
        });
        return true;
      }

      if (message.action === 'EXTRACT_ATTENDANCE') {
        const result = extractAllStudents(document);
        sendResponse({
          success: result.students.length > 0,
          report: result
        });
        return true;
      }

      if (message.action === 'HIGHLIGHT_STUDENT') {
        const usn = message.usn;
        const target = document.querySelector(`[data-usn="${usn}"], #student-${usn}`);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'center' });
          target.style.outline = '3px solid #10b981';
          setTimeout(() => {
            target.style.outline = '';
          }, 3000);
          sendResponse({ highlighted: true });
        } else {
          sendResponse({ highlighted: false });
        }
        return true;
      }

      return false;
    });
  }

  // Node.js test environment export
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      extractAllStudents,
      isAttendanceTable,
      parseStudentFromTableContext,
      parseAttendanceRows
    };
  }
})();
