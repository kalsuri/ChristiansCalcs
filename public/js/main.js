const main = {
    addRow: function() {
      const matrix = document.getElementById('matrix');
      const rowCount = matrix.rows.length;
      const columnCount = matrix.rows[0].cells.length;
      const newRow = matrix.insertRow(-1);
  
      for (let j = 0; j < columnCount; j++) {
          const newCell = newRow.insertCell(j);
          const input = document.createElement('input');
          input.type = 'text';
          input.name = `matrix[${rowCount}][${j}]`;
          input.classList.add('matrix-input'); // Add the class 'matrix-input'
          newCell.appendChild(input);
      }
    },
    addColumn: function() {
      const matrix = document.getElementById('matrix');
      const rowCount = matrix.rows.length;
  
      for (let i = 0; i < rowCount; i++) {
          const row = matrix.rows[i];
          const columnCount = row.cells.length;
          const newCell = row.insertCell(columnCount);
          const input = document.createElement('input');
          input.type = 'text';
          input.name = `matrix[${i}][${columnCount}]`;
          input.classList.add('matrix-input'); // Add the class 'matrix-input'
          newCell.appendChild(input);
      }
    },
    removeRow: function() {
      const matrix = document.getElementById('matrix');
      const rowCount = matrix.rows.length;
      if (rowCount > 1) { // Prevent removing all rows
          matrix.deleteRow(rowCount - 1);
      }
    },
    removeColumn: function() {
      const matrix = document.getElementById('matrix');
      const rowCount = matrix.rows.length;
  
      for (let i = 0; i < rowCount; i++) {
          const row = matrix.rows[i];
          const columnCount = row.cells.length;
          if (columnCount > 1) { // Prevent removing all columns
              row.deleteCell(columnCount - 1);
          }
      }
    },
    onSubmit: function(event) {
      const form = event.target;
      const inputs = document.querySelectorAll('input[type="text"]');
      inputs.forEach(input => {
        if (input.value.trim() === '') {
          input.value = '0'; // Replace empty values with zero
        }
      });
      form.submit(); // Proceed with the form submission after filling in zeros
    }
};
  
  // Attach the onSubmit function to form submission
  document.addEventListener('DOMContentLoaded', function () {
    document.querySelector('form').addEventListener('submit', function (e) {
      e.preventDefault(); // Prevent the form from submitting immediately
      main.onSubmit(e); // Call the onSubmit method
    });
  });
  