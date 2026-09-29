const request = require('supertest');
const app = require('./app');

describe('Pruebas Unitarias y de Seguridad - Módulo Donantes', () => {
  let adminToken;
  let userToken;

  beforeAll(async () => {
    const adminRes = await request(app).post('/login').send({ usuario: 'AdminMaster', rol: 'admin' });
    adminToken = adminRes.body.token;

    const userRes = await request(app).post('/login').send({ usuario: 'VoluntarioJuan', rol: 'usuario' });
    userToken = userRes.body.token;
  });

  describe('Autenticación (/login)', () => {
    it('Debe generar un token válido con credenciales correctas', async () => {
      const res = await request(app).post('/login').send({ usuario: 'TestUser', rol: 'usuario' });
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('token');
    });

    it('Debe retornar 400 si faltan parámetros en el login', async () => {
      const res = await request(app).post('/login').send({ usuario: 'Incompleto' });
      expect(res.statusCode).toBe(400);
    });
  });

  describe('Control de Acceso y Middleware verificarToken', () => {
    it('Debe rechazar peticiones sin cabecera Authorization (401)', async () => {
      const res = await request(app).get('/donantes');
      expect(res.statusCode).toBe(401);
    });

    it('Debe rechazar tokens inválidos (403)', async () => {
      const res = await request(app).get('/donantes').set('Authorization', 'Bearer token_invalido');
      expect(res.statusCode).toBe(403);
    });
  });

  describe('Gestión de Donantes (CRUD)', () => {
    it('Debe listar los donantes si el usuario está autenticado', async () => {
      const res = await request(app).get('/donantes').set('Authorization', `Bearer ${userToken}`);
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('Debe registrar un nuevo donante correctamente', async () => {
      const res = await request(app)
        .post('/donantes')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ nombre: 'Lucía Fernández', tipoSangre: 'B+', montoDonado: 850 });

      expect(res.statusCode).toBe(201);
    });

    it('Debe rechazar registro si faltan campos obligatorios', async () => {
      const res = await request(app)
        .post('/donantes')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ montoDonado: 500 });

      expect(res.statusCode).toBe(400);
    });

    it('No debe permitir a un usuario normal eliminar donantes (403)', async () => {
      const res = await request(app)
        .delete('/donantes/1')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.statusCode).toBe(403);
    });

    it('Debe permitir al administrador eliminar un donante (200)', async () => {
      const res = await request(app)
        .delete('/donantes/1')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
    });

    it('Debe devolver 404 al intentar eliminar un donante inexistente', async () => {
      const res = await request(app)
        .delete('/donantes/999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(404);
    });
  });
});