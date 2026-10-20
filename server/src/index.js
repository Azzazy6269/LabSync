const dotenv = require('dotenv');
dotenv.config();

const app = require('./app');


const PORT = process.env.PORT || 1234;

const runServer=async()=>{
    app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
    });
}

runServer()