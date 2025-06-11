require('dotenv').config();
const express = require('express');
const authRoutes = require('./routes/auth');
const permissionRoutes = require('./routes/permissions');

const app = express();
app.use(express.json());

app.use('/api/auth', authRoutes);

const authenticateToken = require('./middleware/auth');

app.get('/api/protected', authenticateToken, (req, res) => {
  res.json({
    message: 'You have accessed a protected route',
    user: req.user
  });
});


app.use(express.json()); // required to parse JSON body
app.use('/api/permissions', permissionRoutes);


app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});
