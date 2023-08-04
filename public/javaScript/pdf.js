  // Function to populate year, month, and day dropdowns
  function populateDropdowns(selectId, start, end) {
    const select = document.getElementById(selectId);
    for (let i = start; i <= end; i++) {
      const option = document.createElement('option');
      option.value = i;
      option.textContent = i;
      select.appendChild(option);
    }
  }

  // Populate year dropdowns (Change the range as needed)
  populateDropdowns('yearFrom', 2000, 2023);
  populateDropdowns('yearTo', 2000, 2023);

  // Populate month dropdowns
  populateDropdowns('monthFrom', 1, 12);
  populateDropdowns('monthTo', 1, 12);

  // Function to get the number of days in a month
  function daysInMonth(month, year) {
    return new Date(year, month, 0).getDate();
  }

  // Function to populate day dropdowns based on selected month and year
  function updateDayDropdown(selectId, monthSelectId, yearSelectId) {
    const monthSelect = document.getElementById(monthSelectId);
    const yearSelect = document.getElementById(yearSelectId);
    const selectedMonth = parseInt(monthSelect.value);
    const selectedYear = parseInt(yearSelect.value);
    const numDays = daysInMonth(selectedMonth, selectedYear);
    
    const select = document.getElementById(selectId);
    select.innerHTML = '';
    for (let i = 1; i <= numDays; i++) {
      const option = document.createElement('option');
      option.value = i;
      option.textContent = i;
      select.appendChild(option);
    }
  }

  // Event listeners for month and year changes
  document.getElementById('monthFrom').addEventListener('change', function() {
    updateDayDropdown('dayFrom', 'monthFrom', 'yearFrom');
  });

  document.getElementById('yearFrom').addEventListener('change', function() {
    updateDayDropdown('dayFrom', 'monthFrom', 'yearFrom');
  });

  document.getElementById('monthTo').addEventListener('change', function() {
    updateDayDropdown('dayTo', 'monthTo', 'yearTo');
  });

  document.getElementById('yearTo').addEventListener('change', function() {
    updateDayDropdown('dayTo', 'monthTo', 'yearTo');
  });