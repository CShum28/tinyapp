// emal loopup helper function

function getUserByEmail(email, database) {
  for (const userId in database) {
    if (email === database[userId].email) {
      return database[userId];
      // return true;
    }
  }
  return undefined;
  // return false;
}

module.exports = { getUserByEmail };
