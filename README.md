# 🎨 TBT - Tokens Transferibles Facturables

**Un Marco Colaborativo entre Transbit y BROCHA**

Sistema de certificación, gestión y monetización de obras creativas para artistas.

---

## 🚀 Quick Start

### Prerequisitos
- Node.js 18+
- Cuenta en [Supabase](https://supabase.com)

### Instalación

```bash
# Clonar el repositorio
git clone https://github.com/TU_USUARIO/tbt-app.git
cd tbt-app

# Instalar dependencias
npm install

# Configurar variables de entorno
cp env.example .env.local
# Edita .env.local con tus credenciales de Supabase

# Iniciar en desarrollo
npm run dev
```

Abre http://localhost:3000

---

## 📁 Estructura del Proyecto

```
tbt-app/
├── src/                        # Código fuente Next.js
│   ├── app/                    # App Router pages
│   │   ├── page.tsx           # Landing page
│   │   ├── login/             # Inicio de sesión
│   │   ├── registro/          # Registro de usuarios
│   │   ├── crear/             # Formulario crear TBT
│   │   ├── dashboard/         # Panel del artista
│   │   ├── verificar/         # Buscar TBT
│   │   └── work/[tbt_id]/     # Verificación pública
│   ├── components/            # Componentes React
│   ├── lib/                   # Utilidades
│   └── types/                 # Tipos TypeScript
├── documentation/             # Documentación y SQL
│   ├── supabase/             # Esquemas y funciones SQL
│   └── PLAN_DESARROLLO_TBT.md
├── package.json
└── README.md
```

---

## 🔑 Variables de Entorno

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 📊 Funcionalidades

- ✅ Autenticación con email OTP
- ✅ Creación de obras (TBTs)
- ✅ Certificados visuales con QR
- ✅ Descarga de certificados PNG
- ✅ Página de verificación pública
- ✅ Dashboard del artista
- ⏳ Sistema de transferencias
- ⏳ Integración de pagos

---

## 🔗 URLs

| Página | Ruta |
|--------|------|
| Landing | `/` |
| Registro | `/registro` |
| Login | `/login` |
| Dashboard | `/dashboard` |
| Crear TBT | `/crear` |
| Verificar | `/verificar` |
| Obra | `/work/[TBT-ID]` |

---

## 🤝 Colaboradores

- **Transbit** - Infraestructura y pagos
- **BROCHA** - Visión artística y comunidad

---

## 📄 Licencia

Propietario - Transbit & BROCHA
