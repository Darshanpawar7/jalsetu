// backend/server.js
const app = require('./app');
const http = require('http');
const dotenv = require('dotenv');
dotenv.config();

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

server.listen(PORT, () => {
  console.log(`JalSetu backend running on port ${PORT}`);
});
