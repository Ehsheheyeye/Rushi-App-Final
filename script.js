document.addEventListener('DOMContentLoaded', function() {
    // --- ELEMENT SELECTORS ---
    const form = document.getElementById('transactionForm');
    const amountInput = document.getElementById('amount');
    const descriptionInput = document.getElementById('description');
    const suggestionsDatalist = document.getElementById('suggestions');
    const historyBtn = document.getElementById('historyBtn');
    const popup = document.getElementById('popup');
    const addTransactionBtn = document.getElementById('addTransactionBtn');
    const currentBalanceEl = document.getElementById('currentBalance');

    // --- CONFIGURATION ---
    // !!! IMPORTANT: REPLACE WITH YOUR GOOGLE APPS SCRIPT URL !!!
    const googleAppScriptURL = 'https://script.google.com/macros/s/AKfycbwZhDY_y5doScDXkFnU4BUDtIj9pta0Y7zbhqgkdUznsmmBsOFlM5JgrxI3F4cAQ7lv/exec';
    
    // !!! IMPORTANT: REPLACE WITH YOUR GOOGLE SHEET URL FOR THE HISTORY BUTTON !!!
    const googleSheetURL = 'https://docs.google.com/spreadsheets/d/1Qkh1gnaJ8Ab28NWnHUAX5brwVipSTd2eKKpMVUA8rHE/edit?usp=sharing';
    historyBtn.href = googleSheetURL;

    // --- LOCAL STORAGE KEYS ---
    const SUGGESTIONS_KEY = 'transactionSuggestions';
    const BALANCE_KEY = 'currentBalance';

    // --- STATE MANAGEMENT ---
    let suggestions = JSON.parse(localStorage.getItem(SUGGESTIONS_KEY)) || ['Salary', 'Rent', 'Groceries', 'Transport'];
    let currentBalance = parseFloat(localStorage.getItem(BALANCE_KEY)) || 0;

    // --- FUNCTIONS ---
    function updateBalanceDisplay() {
        // Formats the number to have two decimal places
        currentBalanceEl.textContent = `₹ ${currentBalance.toFixed(2)}`;
    }

    function updateDatalist() {
        suggestionsDatalist.innerHTML = '';
        suggestions.forEach(suggestion => {
            const option = document.createElement('option');
            option.value = suggestion;
            suggestionsDatalist.appendChild(option);
        });
    }

    function addSuggestion(newSuggestion) {
        if (newSuggestion && !suggestions.some(s => s.toLowerCase() === newSuggestion.toLowerCase())) {
            suggestions.push(newSuggestion);
            localStorage.setItem(SUGGESTIONS_KEY, JSON.stringify(suggestions));
            updateDatalist();
        }
    }

    function showPopup() {
        popup.classList.add('show');
        setTimeout(() => {
            popup.classList.remove('show');
        }, 2500);
    }

    // --- EVENT LISTENER FOR FORM SUBMISSION ---
    form.addEventListener('submit', function(e) {
        e.preventDefault(); // Prevent default form submission

        addTransactionBtn.disabled = true;
        addTransactionBtn.textContent = 'Adding...';

        // 1. Get form values
        const amount = parseFloat(amountInput.value);
        const description = descriptionInput.value;
        const transactionType = document.querySelector('input[name="transactionType"]:checked').value;

        // 2. Update the balance
        if (transactionType === 'Income') {
            currentBalance += amount;
        } else { // Expense
            currentBalance -= amount;
        }
        localStorage.setItem(BALANCE_KEY, currentBalance);
        updateBalanceDisplay();

        // 3. Create data object for Google Sheet
        const data = {
            amount: amount,
            description: description,
            type: transactionType,
        };

        // 4. Send data to Google Apps Script
        fetch(googleAppScriptURL, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        })
        .then(() => {
            console.log('Transaction data sent to Google Sheet.');
            addSuggestion(description);
            showPopup();
            // 5. Reset the form completely (clears all fields and radio selections)
            form.reset(); 
        })
        .catch(error => {
            console.error('Error:', error);
            // Revert balance if sending fails
            if (transactionType === 'Income') {
                currentBalance -= amount;
            } else {
                currentBalance += amount;
            }
            localStorage.setItem(BALANCE_KEY, currentBalance);
            updateBalanceDisplay();
            alert('An error occurred. Transaction was not saved.');
        })
        .finally(() => {
            addTransactionBtn.disabled = false;
            addTransactionBtn.textContent = 'Add Transaction';
        });
    });

    // --- INITIALIZATION ON PAGE LOAD ---
    updateDatalist();
    updateBalanceDisplay();
});
