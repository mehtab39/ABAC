require('dotenv').config();
const express = require('express');

const app = express();

app.use(express.json());

const cors = require('cors');
app.use(cors()); 

const authRoutes = require('./routes/auth');
const permissionRoutes = require('./routes/permissions');
const policiesRoutes = require('./routes/policies');
const attachPoliciesRoutes = require('./routes/attachPolicy');

app.use('/auth', authRoutes);
app.use('/permissions', permissionRoutes);
app.use('/policies', policiesRoutes);
app.use('/attach-policies', attachPoliciesRoutes);


app.listen(process.env.PORT, () => {

  console.clear();

  const banner = `
  ===========================================
          🚀 Server is up & running
           http://localhost:3000
  ===========================================
  `;
  
  console.log(banner);

});
