const fs = require('fs');
const path = require('path');

// Configuration
const srcDir = path.join(__dirname, 'src');
const ignoreDirs = ['.git', 'node_modules', '.next', 'public'];
const extensions = ['.js', '.jsx', '.ts', '.tsx', '.css', '.scss', '.sass', '.less', '.json'];

// Get all files in the src directory
function getAllFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !ignoreDirs.includes(file)) {
      fileList = getAllFiles(filePath, fileList);
    } else if (stat.isFile() && extensions.includes(path.extname(file))) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

// Check if a file is imported anywhere in the project
function isFileImported(filePath, allFiles) {
  const relativePath = path.relative(__dirname, filePath).replace(/\\/g, '/');
  const fileName = path.basename(filePath, path.extname(filePath));
  
  // Skip checking the file against itself
  const otherFiles = allFiles.filter(f => f !== filePath);
  
  // Check if the file is imported in any other file
  for (const otherFile of otherFiles) {
    const ext = path.extname(otherFile);
    if (['.js', '.jsx', '.ts', '.tsx'].includes(ext)) {
      const content = fs.readFileSync(otherFile, 'utf8');
      
      // Check for various import patterns
      if (content.includes(`from './${fileName}'`) || 
          content.includes(`from "../${fileName}"`) || 
          content.includes(`from '/${fileName}'`) ||
          content.includes(`import ${fileName}`) ||
          content.includes(`require('./${fileName}')`) ||
          content.includes(`require("${fileName}")`) ||
          content.includes(`"${fileName}"`) ||
          content.includes(`'${fileName}'`)) {
        return true;
      }
      
      // Check for dynamic imports
      if (content.includes(`import('${fileName}')`) || 
          content.includes(`import("./${fileName}")`) ||
          content.includes(`dynamic('${fileName}')`) ||
          content.includes(`dynamic("./${fileName}")`)) {
        return true;
      }
    }
  }
  
  return false;
}

// Special files that are always used (entry points, etc.)
function isSpecialFile(filePath) {
  const specialFiles = [
    'src/app/layout.tsx',
    'src/app/page.tsx',
    'src/middleware.ts',
    'src/app/api',
    'src/app/auth'
  ];
  
  const relativePath = path.relative(__dirname, filePath).replace(/\\/g, '/');
  
  return specialFiles.some(specialFile => relativePath.startsWith(specialFile));
}

// Main function
function findUnusedFiles() {
  const allFiles = getAllFiles(srcDir);
  const unusedFiles = [];
  
  console.log(`Scanning ${allFiles.length} files for unused files...`);
  
  allFiles.forEach(file => {
    if (isSpecialFile(file)) {
      return;
    }
    
    if (!isFileImported(file, allFiles)) {
      unusedFiles.push(path.relative(__dirname, file).replace(/\\/g, '/'));
    }
  });
  
  console.log('\nPotentially unused files:');
  if (unusedFiles.length === 0) {
    console.log('No unused files found!');
  } else {
    unusedFiles.forEach(file => console.log(file));
    console.log(`\nFound ${unusedFiles.length} potentially unused files.`);
    console.log('Note: This is a heuristic approach and may have false positives. Please verify before removing files.');
  }
}

findUnusedFiles(); 