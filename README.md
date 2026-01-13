# 🎨 TBT - Tokens Transferibles Facturables

**Un Marco Colaborativo entre Transbit y BROCHA**

Sistema de certificación, gestión y monetización de obras creativas para artistas.

---

## 🚀 Quick Start

### Prerequisitos
- Cuenta en [Supabase](https://supabase.com)
- Cuenta en [Supaforms](https://supaforms.com)
- Node.js 18+ (para desarrollo frontend)

### Paso 1: Configurar Supabase

1. **Crear nuevo proyecto en Supabase**
   - Ve a [supabase.com](https://supabase.com) y crea un nuevo proyecto
   - Guarda la URL del proyecto y las API keys

2. **Ejecutar el esquema de base de datos**
   - Ve a SQL Editor en tu proyecto de Supabase
   - Copia y ejecuta el contenido de `supabase/schema.sql`

3. **Configurar Storage**
   - Ve a Storage en Supabase
   - Crea los siguientes buckets:
     - `works-media` (público)
     - `avatars` (público)
     - `certificates` (público)

4. **Configurar Autenticación**
   - Ve a Authentication > Providers
   - Habilita Email con OTP
   - Opcional: Habilita Phone (para MMS)

### Paso 2: Configurar Supaforms

1. **Conectar con Supabase**
   - En Supaforms, ve a Settings > Integrations
   - Conecta tu proyecto de Supabase

2. **Crear los formularios**
   - Sigue la guía en `supaforms/GUIA_SUPAFORMS.md`

### Paso 3: Desplegar Frontend (Opcional)

```bash
# Cuando el frontend esté listo
cd frontend
npm install
npm run dev
```

---

## 📁 Estructura del Proyecto

```
Forms/
├── README.md                    # Este archivo
├── PLAN_DESARROLLO_TBT.md      # Plan detallado del proyecto
├── supabase/
│   ├── schema.sql              # Esquema de base de datos
│   └── functions/              # Edge Functions
│       ├── create-tbt/
│       ├── transfer-work/
│       └── generate-certificate/
├── supaforms/
│   └── GUIA_SUPAFORMS.md       # Guía de configuración de formularios
└── frontend/                    # (Próximamente) App Next.js
```

---

## 🔑 Variables de Entorno

Crea un archivo `.env.local` con:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://[tu-proyecto].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[tu-anon-key]
SUPABASE_SERVICE_ROLE_KEY=[tu-service-role-key]

# Transb.it (para pagos)
TRANSBIT_API_KEY=[tu-api-key]
TRANSBIT_WEBHOOK_SECRET=[tu-webhook-secret]

# Opcional: AI
OPENAI_API_KEY=[tu-openai-key]
```

---

## 📊 Flujos Principales

### 1. Creación de TBT
```
Artista → Autenticación → Formulario → Upload Media → 
Certificación → TBT ID Generado → Certificado Enviado
```

### 2. Transferencia
```
Propietario inicia → Calcula regalía → Link de pago →
Pago confirmado → Actualiza propiedad → Nuevo certificado
```

### 3. Verificación
```
Usuario/Coleccionista → Ingresa TBT ID → 
Ve certificado + historial completo
```

---

## 🔗 URLs del Sistema

| Página | URL |
|--------|-----|
| Verificación | `tbt.cafe/work/[TBT-ID]` |
| Dashboard | `tbt.cafe/dashboard` |
| Crear Obra | `tbt.cafe/crear` |
| Perfil Artista | `tbt.cafe/artist/[username]` |

---

## 📝 Tareas Pendientes

- [ ] Configurar proyecto Supabase
- [ ] Ejecutar schema SQL
- [ ] Crear buckets de Storage
- [ ] Configurar autenticación OTP
- [ ] Crear formularios en Supaforms
- [ ] Desarrollar frontend
- [ ] Integrar sistema de pagos
- [ ] Testing end-to-end

---

## 🤝 Colaboradores

- **Transbit** - Infraestructura y pagos
- **BROCHA** - Visión artística y comunidad

---

## 📄 Licencia

Propietario - Transbit & BROCHA
