# 🚀 Pasos Siguientes - TBT

## ✅ Completado
- [x] Esquema de base de datos diseñado (`supabase/schema.sql`)
- [x] Edge Functions creadas
- [x] Documentación inicial

---

## 📋 Paso 1: Configurar Supabase (AHORA)

### 1.1 Crear proyecto en Supabase
1. Ve a [supabase.com](https://supabase.com)
2. Click en "New Project"
3. Nombre: `tbt-brocha` (o el que prefieras)
4. Región: Selecciona la más cercana a Latinoamérica
5. Contraseña de BD: **Guárdala en un lugar seguro**

### 1.2 Ejecutar el esquema SQL
1. En tu proyecto Supabase, ve a **SQL Editor**
2. Crea un nuevo query
3. Copia TODO el contenido de `supabase/schema.sql`
4. Click en **Run**
5. Verifica que no haya errores

### 1.3 Crear Storage Buckets
1. Ve a **Storage** en el menú lateral
2. Click en "New bucket" y crea estos 3:

| Bucket | Público | Descripción |
|--------|---------|-------------|
| `works-media` | ✅ Sí | Imágenes de las obras |
| `avatars` | ✅ Sí | Fotos de perfil |
| `certificates` | ✅ Sí | PDFs de certificados |

3. Para cada bucket, configura las políticas:
   - Permitir uploads a usuarios autenticados
   - Permitir lecturas públicas

### 1.4 Configurar Autenticación
1. Ve a **Authentication** > **Providers**
2. **Email**:
   - Habilitar ✅
   - Enable "Confirm email" ✅
   - Enable "Secure email change" ✅
3. **Phone** (opcional para MMS):
   - Habilitar ✅
   - Configurar proveedor SMS (Twilio recomendado)

### 1.5 Obtener las credenciales
1. Ve a **Settings** > **API**
2. Copia y guarda:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJ...`
   - **service_role key**: `eyJ...` (¡SECRETO!)

---

## 📝 Paso 2: Configurar Supaforms

### 2.1 Conectar Supabase
1. Entra a tu cuenta de [Supaforms](https://supaforms.com)
2. Ve a **Settings** > **Integrations** > **Supabase**
3. Ingresa:
   - Project URL
   - Anon Key
4. Prueba la conexión

### 2.2 Crear Formulario: Registro de Artista
Crea un form con estos campos:

```
📋 Nombre: tbt-registro
📊 Tabla destino: profiles

Campos:
1. display_name (Text, Required)
   Label: "Nombre artístico"
   
2. email (Email, Required)
   Label: "Correo electrónico"
   
3. phone (Phone, Optional)
   Label: "Teléfono (opcional)"
   
4. bio (Textarea, Optional)
   Label: "Sobre ti"
   Placeholder: "Cuéntanos sobre tu arte..."
```

### 2.3 Crear Formulario: Nueva Obra
Crea un form multi-step:

```
📋 Nombre: tbt-crear-obra
📊 Requiere autenticación: ✅

--- PASO 1: La Obra ---
1. title (Text, Required)
2. description (Textarea, Required)
3. category (Select: Pintura, Escultura, Digital, Fotografía, Mixta)
4. technique (Text, Optional)
5. media (File Upload, Required, accept: image/*)

--- PASO 2: Comercio ---
6. initial_price (Number, Required)
7. royalty_type (Select: Porcentaje, Monto Fijo)
8. royalty_value (Number, Required)
9. is_for_sale (Checkbox)

--- PASO 3: Confirmar ---
Vista previa + checkbox de términos
```

### 2.4 Crear Formulario: Transferencia
```
📋 Nombre: tbt-transferir
📊 Requiere autenticación: ✅

Campos:
1. tbt_id (Text, Required)
   Pattern: TBT-####-XXXXXX
   
2. to_email (Email, Required)
   Label: "Email del nuevo propietario"
   
3. transfer_type (Select: Venta, Regalo)

4. sale_price (Number, Conditional - solo si Venta)

5. notes (Textarea, Optional)
```

---

## 🌐 Paso 3: Desplegar Edge Functions

### 3.1 Instalar Supabase CLI
```bash
# macOS
brew install supabase/tap/supabase

# O con npm
npm install -g supabase
```

### 3.2 Iniciar y vincular proyecto
```bash
cd /Users/henrygarzon/Projects/Forms

# Login
supabase login

# Vincular con tu proyecto
supabase link --project-ref [tu-project-ref]
```

### 3.3 Desplegar las funciones
```bash
# Desplegar todas
supabase functions deploy create-tbt
supabase functions deploy transfer-work
supabase functions deploy verify-tbt
```

---

## 💻 Paso 4: Iniciar el Frontend

El frontend ya está creado. Para ejecutarlo:

```bash
# Entrar a la carpeta frontend
cd /Users/henrygarzon/Projects/Forms/frontend

# Instalar dependencias
npm install

# Configurar variables de entorno
cp env.example .env.local
# Edita .env.local con tus credenciales de Supabase

# Iniciar en modo desarrollo
npm run dev
```

### Páginas disponibles:
| Ruta | Descripción |
|------|-------------|
| `/` | Landing page |
| `/registro` | Registro de usuarios |
| `/login` | Inicio de sesión |
| `/crear` | Formulario para crear TBT |
| `/dashboard` | Panel del artista |
| `/verificar` | Buscar TBT por ID |
| `/work/[tbt_id]` | Página de verificación pública |

---

## 🧪 Paso 5: Probar el Sistema

### Test 1: Registro
1. Abre el form de registro
2. Llena los datos
3. Verifica en Supabase > Table Editor > profiles

### Test 2: Crear Obra
1. Autentícate
2. Abre el form de crear obra
3. Sube una imagen
4. Completa todos los pasos
5. Verifica:
   - Tabla `works` tiene el registro
   - Tabla `work_commerce` tiene la config
   - El TBT ID se generó (formato: TBT-2026-XXXXXX)

### Test 3: Verificación
```bash
# Probar endpoint de verificación
curl "https://[tu-proyecto].supabase.co/functions/v1/verify-tbt?tbt_id=TBT-2026-XXXXXX"
```

---

## 📞 ¿Necesitas ayuda?

Si tienes dudas en algún paso, puedo ayudarte con:
- Configuración específica de Supabase
- Diseño de formularios en Supaforms
- Creación del frontend
- Integración con Transb.it para pagos

¡Solo pregunta! 🚀
