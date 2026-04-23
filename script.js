document.addEventListener('DOMContentLoaded', () => {
    const tableBody = document.getElementById('table-body');
    const saveBtn = document.getElementById('save-btn');
    const toast = document.getElementById('toast');
    const navItems = document.querySelectorAll('.nav-item');
    const errorLog = document.getElementById('error-log');
    const errorList = document.getElementById('error-list');
    const errorCountSpan = document.getElementById('error-count');
    const resolvedCountSpan = document.getElementById('resolved-count');
    const cellTooltip = document.getElementById('cell-tooltip');

    // State for errors
    let activeErrors = [];

    function showTooltip(e, text) {
        cellTooltip.textContent = text;
        const rect = e.target.getBoundingClientRect();
        
        // Position above the cell
        cellTooltip.style.left = `${rect.left + (rect.width / 2) - (cellTooltip.offsetWidth / 2)}px`;
        cellTooltip.style.top = `${rect.top - cellTooltip.offsetHeight - 10}px`;
        cellTooltip.classList.add('show');
    }

    function hideTooltip() {
        cellTooltip.classList.remove('show');
    }

    // Populate Table with initial data
    const rowCount = 100;
    const colCount = 15;
    
    // Choose specific rows for errors as per documentation
    const errorRowIndices = [25, 40, 72, 85, 98];
    // Assign a random column to each error row
    const errorLocations = errorRowIndices.map(row => ({
        row: row,
        col: Math.floor(Math.random() * (colCount - 1)) + 2
    }));

    for (let i = 1; i <= rowCount; i++) {
        const tr = document.createElement('tr');
        
        const tdSn = document.createElement('td');
        tdSn.textContent = i;
        tdSn.classList.add('sticky-col');
        tr.appendChild(tdSn);

        for (let j = 2; j <= colCount; j++) {
            const td = document.createElement('td');
            const input = document.createElement('input');
            input.type = 'text';
            
            const randomVal = Math.floor(Math.random() * 9000) + 1000;
            input.value = randomVal;

            const errorMatch = errorLocations.find(loc => loc.row === i && loc.col === j);
            if (errorMatch && activeErrors.length < 5) {
                // Determine error type
                const errorTypes = [
                    { msg: "Missing Input", val: "", suggestion: "Please enter a 4-digit number" },
                    { msg: "Non-Numeric Values", val: "12-X", suggestion: "Remove letters or special characters" },
                    { msg: "Incorrect Length", val: "123", suggestion: "Enter exactly 4 digits" },
                    { msg: "Invalid Range", val: "850", suggestion: "Number must be 1000 or greater" },
                    { msg: "Decimal or Non-Integer", val: "1245.5", suggestion: "Use a number without decimals" }
                ];
                const error = errorTypes[activeErrors.length];
                input.value = error.val;
                input.classList.add('cell-error');
                
                const errorObj = {
                    id: `err-${activeErrors.length}`,
                    message: error.msg,
                    suggestion: error.suggestion,
                    row: i,
                    col: j,
                    element: input,
                    resolved: false
                };
                activeErrors.push(errorObj);

                input.addEventListener('mouseenter', (e) => {
                    if (!errorObj.resolved) showTooltip(e, errorObj.suggestion);
                });
                input.addEventListener('mouseleave', hideTooltip);
            }

            input.addEventListener('input', () => {
                hideTooltip();
                const err = activeErrors.find(e => e.element === input);
                if (err && !err.resolved) {
                    const val = input.value;
                    if (/^\d{4}$/.test(val) && parseInt(val) >= 1000) {
                        err.resolved = true;
                        input.classList.remove('cell-error');
                        updateErrorLog();
                    }
                }
            });

            td.appendChild(input);
            tr.appendChild(td);
        }
        tableBody.appendChild(tr);
    }

    function updateErrorLog() {
        errorList.innerHTML = '';
        const resolvedCount = activeErrors.filter(e => e.resolved).length;
        
        // Counter format: Resolved / Total
        resolvedCountSpan.textContent = `${resolvedCount}/${activeErrors.length}`;
        errorCountSpan.textContent = activeErrors.length;

        activeErrors.forEach((err, index) => {
            const item = document.createElement('div');
            item.className = `error-item ${err.resolved ? 'resolved' : ''}`;
            
            const actionContent = err.resolved 
                ? '<i class="ph ph-check-circle check-icon"></i>' 
                : `<a class="fix-btn" data-id="${err.id}">Fix Now</a>`;

            item.innerHTML = `
                <span class="col-err">${index + 1}. ${err.message} <span class="error-suggestion">(${err.suggestion})</span></span>
                <span class="col-loc">Row - ${err.row} \u00B7 Column - ${err.col}</span>
                <span class="col-act">${actionContent}</span>
            `;
            errorList.appendChild(item);
        });

        // Initialize icons for the newly added checkmarks
        if (window.lucide) {
            lucide.createIcons();
        }

        // Add event listeners to "Fix Now" links
        document.querySelectorAll('.fix-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const errId = e.target.getAttribute('data-id');
                const err = activeErrors.find(e => e.id === errId);
                if (err) {
                    err.element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
                    setTimeout(() => err.element.focus(), 500);
                }
            });
        });

        if (resolvedCount === activeErrors.length && activeErrors.length > 0) {
            // All resolved, hide log after a short delay so user sees final checkmark
            setTimeout(() => {
                errorLog.style.display = 'none';
                saveBtn.disabled = false; // Enable save button when errors are gone
                toast.textContent = "All errors resolved! You can now save.";
                toast.classList.add('show');
                setTimeout(() => toast.classList.remove('show'), 3000);
            }, 1500);
        }
    }

    // Sidebar Navigation
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
        });
    });

    // Save Button
    saveBtn.addEventListener('click', () => {
        const resolvedCount = activeErrors.filter(e => e.resolved).length;
        
        if (resolvedCount < activeErrors.length) {
            // Show errors and disable save until resolved
            errorLog.style.display = 'block';
            saveBtn.disabled = true;
            updateErrorLog();
            errorLog.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
            // Standard save flow
            const originalText = saveBtn.textContent;
            saveBtn.textContent = 'Saving...';
            saveBtn.disabled = true;

            const successModal = document.getElementById('success-modal');

            setTimeout(() => {
                saveBtn.textContent = originalText;
                saveBtn.disabled = false;
                
                // Show Success Modal
                successModal.classList.add('show');
                
                // Hide Modal after 2.5 seconds
                setTimeout(() => {
                    successModal.classList.remove('show');
                }, 2500);
            }, 800);
        }
    });

    // Cancel Button Reset
    const cancelBtn = document.getElementById('cancel-btn');
    cancelBtn.addEventListener('click', () => {
        window.location.reload();
    });

    // Documents Modal Interaction
    const navDocs = document.getElementById('nav-docs');
    const docsModal = document.getElementById('docs-modal');
    const closeDocsModal = document.getElementById('close-docs-modal');
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');

    navDocs.addEventListener('click', (e) => {
        e.preventDefault();
        docsModal.classList.add('show');
    });

    closeDocsModal.addEventListener('click', () => {
        docsModal.classList.remove('show');
    });

    // Close on outside click
    docsModal.addEventListener('click', (e) => {
        if (e.target === docsModal) {
            docsModal.classList.remove('show');
        }
    });

    // Tab Switching Logic
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.getAttribute('data-tab');

            // Update Buttons
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Update Panes
            tabPanes.forEach(pane => {
                pane.classList.remove('active');
                if (pane.id === target) {
                    pane.classList.add('active');
                }
            });
        });
    });

    // Interaction Prototype Button
    const protoBtn = document.getElementById('proto-btn');
    const navLab = document.getElementById('nav-lab');
    protoBtn.addEventListener('click', () => {
        docsModal.classList.remove('show');
        
        // Update nav active state
        navItems.forEach(nav => nav.classList.remove('active'));
        navLab.classList.add('active');
    });

    // Open by default
    // docsModal.classList.add('show');
});
