# Carné Virtual ESAN — Guía de despliegue

## Archivos del proyecto
```
index.html   → estructura de la app
style.css    → estilos visuales
app.js       → lógica + conexión a Supabase
```

---

## PASO 1 — Crear cuenta en Supabase (gratis)

1. Ve a https://supabase.com y crea una cuenta gratuita
2. Haz clic en "New project"
3. Ponle un nombre (ej: `esan-carnet`) y elige una contraseña para la base de datos
4. Espera ~2 minutos a que se cree el proyecto

---

## PASO 2 — Crear la tabla en Supabase

1. En el panel de Supabase, ve a **SQL Editor**
2. Pega y ejecuta este SQL:

```sql
create table carnets (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade unique,
  nombres text,
  apellidos text,
  carrera text,
  codigo text,
  foto_url text,
  updated_at timestamptz default now()
);

-- Habilitar Row Level Security
alter table carnets enable row level security;

-- Cada usuario solo ve y edita su propio registro
create policy "Usuario ve su carné"
  on carnets for select using (auth.uid() = user_id);

create policy "Usuario crea su carné"
  on carnets for insert with check (auth.uid() = user_id);

create policy "Usuario actualiza su carné"
  on carnets for update using (auth.uid() = user_id);
```

---

## PASO 3 — Obtener credenciales de Supabase

1. En el panel, ve a **Settings → API**
2. Copia:
   - **Project URL** → algo como `https://abcxyz.supabase.co`
   - **anon public key** → una clave larga que empieza con `eyJ...`

3. Abre el archivo `app.js` y reemplaza al inicio:

```js
const SUPABASE_URL = 'https://TU_PROYECTO.supabase.co';  // ← pega tu URL aquí
const SUPABASE_KEY = 'TU_ANON_KEY';                      // ← pega tu clave aquí
```

---

## PASO 4 — Subir a Vercel (gratis)

### Opción A — Sin instalar nada (drag & drop)
1. Ve a https://vercel.com y crea una cuenta gratuita
2. En el dashboard haz clic en **"Add New → Project"**
3. Selecciona **"Deploy from your computer"** o usa "Import Git Repository"
4. Arrastra la carpeta `esan-carnet` completa
5. Haz clic en **Deploy**
6. En ~30 segundos tendrás un link tipo: `https://esan-carnet.vercel.app`

### Opción B — Con GitHub (recomendado para actualizaciones)
1. Sube la carpeta a un repositorio de GitHub
2. En Vercel conecta tu cuenta de GitHub
3. Selecciona el repositorio
4. Deploy automático — cada cambio que subas a GitHub se publica solo

---

## PASO 5 — Habilitar registro de usuarios en Supabase

1. Ve a **Authentication → Settings**
2. Asegúrate de que **"Enable email confirmations"** esté desactivado (para facilitar el registro)
   - O déjalo activado si quieres que los usuarios confirmen su correo

---

## ¿Cómo funciona la app?

- Cualquier persona entra al link y se registra con su correo y contraseña
- Cada usuario tiene su propio carné guardado en la base de datos
- Solo puede ver y editar su propio carné (seguridad por Row Level Security)
- Los datos se guardan automáticamente al hacer clic en "Guardar cambios"

---

## Límites del plan gratuito

| Servicio | Límite gratuito |
|----------|----------------|
| Supabase | 50,000 usuarios, 500 MB base de datos |
| Vercel   | Ancho de banda ilimitado, 100 GB/mes |

Más que suficiente para uso universitario.

---

## Soporte
Si tienes problemas con el despliegue, puedes pedir ayuda adicional a Claude con los mensajes de error específicos.
