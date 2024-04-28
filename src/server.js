import express from 'express';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import Database from 'sqlite3';
import { rowReduction } from './support.js';
import { unlink } from 'fs';

const app = express();
const __dirname = dirname(fileURLToPath(import.meta.url));  // Correct use of ES Modules to get __dirname
const scriptPath = join(__dirname, 'PDEwavesim.py');  // Ensure this path is correct
const sqlite3 = Database.verbose();
const db = new sqlite3.Database(':memory:');

app.set('view engine', 'pug');
app.set('views', join(__dirname, '../views'));  // Confirm this path if views are correctly located
app.use(express.static(join(__dirname, '../public')));  // Static files path check
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Create tables for calculator data
db.serialize(() => {
  db.run('CREATE TABLE IF NOT EXISTS pde_calculator(id INTEGER PRIMARY KEY AUTOINCREMENT, input TEXT)');
  db.run('CREATE TABLE IF NOT EXISTS matrix_row_reduction (id INTEGER PRIMARY KEY AUTOINCREMENT, A TEXT, rrefA TEXT, row_number INTEGER)');});

app.get('/', (req, res) => {
  res.render('index');
});

app.get('/rref', (req, res) => {
  res.render('rref');
});

app.post('/rref', (req, res) => {
  const matrix = req.body.matrix;
  const rrefMatrix = rowReduction(matrix);

  // First, fetch the current count of rows to determine the next row_number
  db.get('SELECT COUNT(*) AS count FROM matrix_row_reduction', (err, row) => {
    if (err) {
      console.error(err.message);
      res.status(500).send('Error calculating row number');
    } else {
      const rowNumber = row.count; // This will be our row number for the new entry

      // Insert new matrix into the database with row_number
      db.run('INSERT INTO matrix_row_reduction (A, rrefA, row_number) VALUES (?, ?, ?)', 
      [JSON.stringify(matrix), JSON.stringify(rrefMatrix), rowNumber], function(err) {
          if (err) {
              console.error(err.message);
              res.status(500).send('Error processing your matrix');
          } else {
              // Fetch existing matrix data from the database
              db.all('SELECT * FROM matrix_row_reduction', (err, data) => {
                  if (err) {
                      console.error(err.message);
                      res.status(500).send('Error fetching existing data');
                  } else {
                      // Render the rref.pug template with both new and existing matrix data
                      res.render('rref', { rrefMatrix: rrefMatrix, data: data });
                  }
              });
          }
      });
    }
  });
});

app.post('/delete/:id', (req, res) => {
  const id = req.params.id;

  // Delete the matrix row with the specified ID from the database
  db.run('DELETE FROM matrix_row_reduction WHERE id = ?', [id], function(err) {
      if (err) {
          console.error(err.message);
          res.status(500).send('Error deleting matrix row');
      } else {
          // Fetch the updated data after deletion
          db.all('SELECT * FROM matrix_row_reduction', (err, data) => {
            if (err) {
              console.error(err.message);
              res.status(500).send('Error fetching updated data');
            } else {
              // Render the 'rref' template with the updated data
              res.render('rref', { data: data });
            }
          });
      }
  });
});


// Define routes for PDE calculator
app.get('/pde-calculator', (req, res) => {
  res.render('pde-calculator');
});

app.post('/pde-calculator', (req, res) => {
  const inputParams = {
    start: req.body.start,
    end: req.body.end,
    N: req.body.N,
    alpha: req.body.alpha,
    function_of_x: req.body.function_of_x
  };

  const paramsString = JSON.stringify(inputParams).replace(/"/g, '\\"');
  const command = `python "${scriptPath}" "${paramsString}"`;

  exec(command, { maxBuffer: 1024 * 5000, timeout: 300000 }, (error, stdout, stderr) => {
    if (error || stderr) {
      console.error(`exec error: ${error}`);
      console.error(`Standard Error: ${stderr}`);
      return res.status(500).send('Error in PDE calculation');
    }
    const gifFileName = stdout.trim(); // Ensure Python script outputs the filename
    const gifUrl = `/img/${gifFileName}`;  // Adjusted URL path for the GIF
    res.redirect(gifUrl);
  });
});





const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

