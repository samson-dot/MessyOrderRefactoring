

// export const charge = (amount) => {
//   for (let attempt = 1; attempt <= 3; attempt++) {
//     if (Math.random() > 0.25) return true; // pretend network call
//   }
//   return false;
// };


//  Payment RETRY 

export const takePayment = () => {

  let paid = false;

  for (let attempt = 1; attempt <= 3 && !paid; attempt++) {
    if (Math.random() > 0.25) // 1.25
      paid = true;
  }
  if (paid) return { ok: true };                       // succeeded
    return { ok: false, reason: "card_declined" };       // failed, with a reason


};