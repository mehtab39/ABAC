require('dotenv').config();
const express = require('express');
const authRoutes = require('./routes/auth');
const permissionRoutes = require('./routes/permissions');
const policiesRoutes = require('./routes/policies');
const rolesRoutes = require('./routes/roles');
const rolePoliciesRoutes = require('./routes/rolePolicies');
const resourceRoutes = require('./routes/resources');


const app = express();
app.use(express.json());


const authenticateToken = require('./middleware/auth');

app.get('/api/protected', authenticateToken, (req, res) => {
  res.json({
    message: 'You have accessed a protected route',
    user: req.user
  });
});


app.use('/auth', authRoutes);

app.use('/permissions', permissionRoutes);
app.use('/policies', policiesRoutes);
app.use('/roles', rolesRoutes);
app.use('/role-policies', rolePoliciesRoutes);
app.use('/resources',authenticateToken, resourceRoutes);




app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});
