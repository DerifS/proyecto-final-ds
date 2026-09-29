const express = require('express');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());

const CLAVE_SECRETA = process.env.JWT_SECRET || 'mi_clave_secreta_segura_2026';

let donantesDB = [
  { id: 1, nombre: 'Carlos Mendoza', tipoSangre: 'O+', montoDonado: 500 },
  { id: 2, nombre: 'Beatriz Morales', tipoSangre: 'A-', montoDonado: 1200 }
];

app.post('/login', (req, res) => {
  const { usuario, rol } = req.body;
  if (!usuario || !rol) {
    return res.status(400).json({ error: 'Credenciales incompletas' });
  }
  const token = jwt.sign({ usuario, rol }, CLAVE_SECRETA, { expiresIn: '2h' });
  res.status(200).json({ token });
});

function verificarToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ error: 'Falta el token de autorización' });
  }

  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;

  try {
    const datos = jwt.verify(token, CLAVE_SECRETA);
    req.usuarioLogueado = datos;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Token inválido o expirado' });
  }
}

app.get('/donantes', verificarToken, (req, res) => {
  res.status(200).json(donantesDB);
});

app.post('/donantes', verificarToken, (req, res) => {
  const { nombre, tipoSangre, montoDonado } = req.body;
  if (!nombre || !tipoSangre) {
    return res.status(400).json({ error: 'Nombre y tipo de sangre son obligatorios' });
  }
  const nuevoDonante = {
    id: donantesDB.length + 1,
    nombre,
    tipoSangre,
    montoDonado: Number(montoDonado) || 0
  };
  donantesDB.push(nuevoDonante);
  res.status(201).json({ mensaje: 'Donante registrado exitosamente', donante: nuevoDonante });
});

app.delete('/donantes/:id', verificarToken, (req, res) => {
  if (req.usuarioLogueado.rol !== 'admin') {
    return res.status(403).json({ error: 'Acceso denegado: se requieren permisos de Administrador' });
  }
  const { id } = req.params;
  const existe = donantesDB.some(d => d.id === parseInt(id));
  
  if (!existe) {
    return res.status(404).json({ error: 'Donante no encontrado' });
  }

  donantesDB = donantesDB.filter(d => d.id !== parseInt(id));
  res.status(200).json({ mensaje: 'Donante eliminado con éxito' });
});

const PORT = process.env.PORT || 3000;
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Servidor activo en el puerto ${PORT}`);
  });
}

module.exports = app;