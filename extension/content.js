/**
 * Contineo Attendance Collector - Content Script
 * Extracts student attendance data from BITM Contineo Proctor SIMS portal.
 */

(function () {
  'use strict';

  // Regular expressions for strict data validation
  // VTU USN standard format: 1 digit (1-4), 2 uppercase letters, 2 digits (year), 2-3 letters (branch), 2-3 digits
  const USN_REGEX = /\b([1-4][A-Z]{2}\d{2}[A-Z]{2,3}\d{2,3})\b/i;
  const COURSE_CODE_REGEX = /\b([0-9][A-Z]{2,4}[0-9]{3}[A-Z0-9]*)\b/i;

  // Known UI keywords to exclude when searching for student names
  const EXCLUDED_NAME_KEYWORDS = [
    'BALLARI', 'INSTITUTE', 'TECHNOLOGY', 'MANAGEMENT',
    'HOME', 'STUDENT', 'COUNSELLING', 'USER', 'MANUAL', 'LOGOUT',
    'COURSE', 'CODE', 'CIE', 'ATTENDANCE', 'SL.NO', 'COMMENTS',
    'DETAILS', 'CURRENT', 'SEM', 'DATA', 'STATUS', 'ACTIVE',
    'COPYRIGHT', 'POWERED', 'CONTINEO', 'TERMS', 'SERVICE', 'PRIVACY'
  ];

  function getNodeText(node) {
    if (!node) return '';
    return (node.innerText !== undefined ? node.innerText : node.textContent) || '';
  }

  /**
   * Main extraction engine
   */
  function extractAllStudents(doc = document) {
    const report = {
      timestamp: new Date().toISOString(),
      pageTitle: doc.title || '',
      url: typeof window !== 'undefined' ? window.location?.href || '' : (doc.defaultView?.location?.href || ''),
      totalDetected: 0,
      successfulRecords: 0,
      failedRecords: 0,
      duplicatesHandled: 0,
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
            if (student && student.usn) {
              report.students.push(student);
            }
          });
        } else {
          report.warnings.push('No attendance tables or student containers found on page.');
        }
      } else {
        // Primary strategy: Process each attendance table with strictly bounded DOM scope
        attendanceTables.forEach((table, index) => {
          try {
            const previousTable = index > 0 ? attendanceTables[index - 1] : null;
            const studentData = parseStudentFromTableContext(table, previousTable, doc, index + 1);
            if (studentData && studentData.usn && studentData.subjects.length > 0) {
              report.students.push(studentData);
            } else {
              report.errors.push({
                index: index + 1,
                error: studentData?.error || 'Could not associate attendance table with a valid student USN or subjects'
              });
            }
          } catch (err) {
            report.errors.push({
              index: index + 1,
              error: `Table parse error on table ${index + 1}: ${err.message}`
            });
          }
        });
      }

      // Deduplicate students by USN
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
        report.duplicatesHandled = duplicateUSNs.length;
      }

      report.students = uniqueStudents;
      report.totalDetected = uniqueStudents.length;
      report.successfulRecords = uniqueStudents.length;
      report.failedRecords = report.errors.length;

    } catch (globalErr) {
      report.errors.push({
        index: 0,
        error: `Extraction aborted: ${globalErr.message}`
      });
      report.failedRecords++;
    }

    return report;
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
   * Parse a student section given its attendance table and previous table boundary
   */
  function parseStudentFromTableContext(table, previousTable, doc, index) {
    let usn = '';
    let name = '';
    let semester = 'SEM03';

    // Strategy 1: Check if inside an enclosing container (e.g. .student-section, [data-usn])
    const container = table.closest('.student-section, [data-usn], .panel, .card, .box, fieldset');
    if (container) {
      usn = container.getAttribute('data-usn') || '';
      const containerText = getNodeText(container);
      
      if (!usn) {
        const match = containerText.match(/USN\s*[:\-]?\s*([1-4][A-Z]{2}\d{2}[A-Z]{2,3}\d{2,3})/i) || containerText.match(USN_REGEX);
        if (match) usn = match[1].toUpperCase();
      }

      const nameEl = container.querySelector('.student-name, h3, h4, .name');
      if (nameEl) {
        name = getNodeText(nameEl).trim();
      }

      const semMatch = containerText.match(/Semester\s*[:\-]?\s*(SEM\d+|\d+(?:st|nd|rd|th)?\s*Sem)/i);
      if (semMatch) semester = normalizeSemester(semMatch[1]);
    }

    // Strategy 2: Bounded DOM Slice between previousTable and current table
    // Guarantees we NEVER mix students even on completely flat pages!
    if (!usn || !name) {
      const sliceNodes = getNodesBetween(previousTable, table, doc);
      let sliceText = '';
      const candidateNames = [];

      sliceNodes.forEach(node => {
        const text = getNodeText(node).trim();
        if (text) {
          sliceText += ' ' + text;
          
          // Check for candidate student names (heading elements, bold text, or spans near images)
          const tag = node.tagName?.toLowerCase();
          if (['h2', 'h3', 'h4', 'strong', 'b', 'span'].includes(tag) || (node.classList && (node.classList.contains('name') || node.classList.contains('student-name')))) {
            const clean = text.replace(/USN.*$/i, '').trim();
            if (clean.length >= 3 && clean.length <= 40 && !isExcludedKeyword(clean)) {
              candidateNames.push(clean);
            }
          }
        }
      });

      if (!usn) {
        const usnMatch = sliceText.match(/USN\s*[:\-]?\s*([1-4][A-Z]{2}\d{2}[A-Z]{2,3}\d{2,3})/i) || sliceText.match(USN_REGEX);
        if (usnMatch) {
          usn = usnMatch[1].toUpperCase();
        }
      }

      if (!name && candidateNames.length > 0) {
        name = candidateNames[0];
      }

      const semMatch = sliceText.match(/(SEM\d+|\d+(?:st|nd|rd|th)?\s*Sem)/i);
      if (semMatch) {
        semester = normalizeSemester(semMatch[1]);
      }
    }

    // Validation checks
    if (!usn) {
      return {
        error: `Could not identify USN for student section ${index}`
      };
    }

    if (!name) {
      name = `Student (${usn})`;
    }

    // Parse rows of the table
    const subjects = parseAttendanceRows(table);

    if (subjects.length === 0) {
      return {
        error: `No subject attendance rows found for student ${usn}`
      };
    }

    // Compute student aggregate
    const overallPercentage = Math.round((subjects.reduce((sum, s) => sum + s.attendance_percentage, 0) / subjects.length) * 10) / 10;

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
   * Collect all DOM element nodes strictly occurring after startNode and before endNode
   */
  function getNodesBetween(startNode, endNode, doc) {
    const nodes = [];
    let collecting = !startNode; // If no startNode, collect from beginning

    const iterator = doc.createNodeIterator(
      doc.body || doc.documentElement,
      doc.defaultView?.NodeFilter?.SHOW_ELEMENT || 1
    );

    let curr;
    while ((curr = iterator.nextNode())) {
      if (!collecting) {
        if (curr === startNode) {
          collecting = true;
        }
        continue;
      }

      if (curr === endNode) {
        break; // Reached end boundary
      }

      // Collect elements in this bounded range
      nodes.push(curr);
    }

    return nodes;
  }

  function isExcludedKeyword(text) {
    const upper = text.toUpperCase();
    return EXCLUDED_NAME_KEYWORDS.some(kw => upper.includes(kw));
  }

  function normalizeSemester(semStr) {
    const numMatch = semStr.match(/(\d+)/);
    if (numMatch) {
      const num = parseInt(numMatch[1], 10);
      return `SEM0${num}`;
    }
    return semStr.toUpperCase().replace(/\s+/g, '');
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
      const match = text.match(/USN\s*[:\-]?\s*([1-4][A-Z]{2}\d{2}[A-Z]{2,3}\d{2,3})/i) || text.match(USN_REGEX);
      if (match) usn = match[1].toUpperCase();
    }

    if (!usn) return null;

    const nameEl = container.querySelector('.student-name, h3, h4, .name');
    const name = nameEl ? getNodeText(nameEl).trim() : `Student (${usn})`;

    let semester = 'SEM03';
    const semMatch = text.match(/(SEM\d+|\d+(?:st|nd|rd|th)?\s*Sem)/i);
    if (semMatch) semester = normalizeSemester(semMatch[1]);

    const table = container.querySelector('table');
    const subjects = table ? parseAttendanceRows(table) : [];

    if (subjects.length === 0) return null;

    const overallPercentage = Math.round((subjects.reduce((sum, s) => sum + s.attendance_percentage, 0) / subjects.length) * 10) / 10;

    return {
      usn,
      name,
      semester,
      totalSubjects: subjects.length,
      overallPercentage,
      subjects
    };
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
        const target = document.querySelector(`[data-usn="${usn}"], #student-${usn}`) ||
          Array.from(document.querySelectorAll('*')).find(el => getNodeText(el).includes(usn));
        
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
