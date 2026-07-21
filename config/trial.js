try {
  // Trying to call something that isn't a function
  const num = 42;
  num.toUpperCase();
} catch (err) {
//   console.log(err.name);    // "TypeError"

//   console.log(err.message); // "num.toUpperCase is not a function"
  console.log(err.stack);   // Shows the file name and exact line number
}