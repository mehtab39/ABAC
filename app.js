require('dotenv').config();
const express = require('express');

const app = express();

app.use(express.json());

const cors = require('cors');
app.use(cors()); 

const authRoutes = require('./routes/auth');
const permissionRoutes = require('./routes/permissions');
const policiesRoutes = require('./routes/policies');
const rolesRoutes = require('./routes/roles');
const rolePoliciesRoutes = require('./routes/rolePolicies');
app.use('/auth', authRoutes);
app.use('/permissions', permissionRoutes);
app.use('/policies', policiesRoutes);
app.use('/roles', rolesRoutes);
app.use('/role-policies', rolePoliciesRoutes);



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
