export function rowReduction(matrix) {
    const numRows = matrix.length;
    const numCols = matrix[0].length;

    // Check if the entire matrix is filled with zeroes
    const isAllZeroes = matrix.every(row => row.every(value => value === 0));
    if (isAllZeroes) {
        return matrix; // Return the original matrix if all elements are 0
    }

    const rrefMatrix = matrix.map(row => row.slice());
    let lead = 0;
    for (let r = 0; r < numRows; r++) {
        if (lead >= numCols) {
            return rrefMatrix;
        }
        let i = r;
        while (rrefMatrix[i][lead] === 0) {
            i++;
            if (i === numRows) {
                i = r;
                lead++;
                if (lead === numCols) {
                    return rrefMatrix;
                }
            }
        }
  
        let temp = rrefMatrix[i];
        rrefMatrix[i] = rrefMatrix[r];
        rrefMatrix[r] = temp;
  
        let val = rrefMatrix[r][lead];
        for (let j = 0; j < numCols; j++) {
            rrefMatrix[r][j] /= val;
        }
  
        for (let i = 0; i < numRows; i++) {
            if (i !== r) {
                val = rrefMatrix[i][lead];
                for (let j = 0; j < numCols; j++) {
                    rrefMatrix[i][j] -= val * rrefMatrix[r][j];
                }
            }
        }
        lead++;
    }

    return rrefMatrix;    
}

