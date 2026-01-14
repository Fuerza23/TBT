# Plan de Desarrollo TBT
## Tokens Transferibles Facturables - Transbit x BROCHA

---

## 📋 Visión General del Proyecto

Sistema para proteger, gestionar y monetizar obras creativas de artistas usando:
- **Supabase**: Base de datos, autenticación y storage
- **Supaforms**: Formularios para captura de datos
- **Frontend**: Next.js o similar para la interfaz web
- **IPFS**: Almacenamiento descentralizado de medios (opcional para MVP)

---

## 🏗️ Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────────┐
│                        USUARIOS                                  │
│         (Artistas, Coleccionistas, Galerías)                    │
└─────────────────────┬───────────────────────────────────────────┘
                      │
        ┌─────────────┼─────────────┐
        │             │             │
        ▼             ▼             ▼
┌───────────┐  ┌───────────┐  ┌───────────┐
│ Supaforms │  │  Web App  │  │ SMS/MMS   │
│ (Captura) │  │ (tbt.cafe)│  │ (Futuro)  │
└─────┬─────┘  └─────┬─────┘  └─────┬─────┘
      │              │              │
      └──────────────┼──────────────┘
                     │
                     ▼
        ┌────────────────────────┐
        │       SUPABASE         │
        │  ┌──────────────────┐  │
        │  │   Auth (OTP)     │  │
        │  ├──────────────────┤  │
        │  │   Database       │  │
        │  ├──────────────────┤  │
        │  │   Storage        │  │
        │  ├──────────────────┤  │
        │  │   Edge Functions │  │
        │  └──────────────────┘  │
        └────────────────────────┘
                     │
                     ▼
        ┌────────────────────────┐
        │   Servicios Externos   │
        │  • Transb.it (Pagos)   │
        │  • IPFS (Storage)      │
        │  • AI (Contexto/Plagio)│
        └────────────────────────┘
```

---

## 📊 Esquema de Base de Datos

### Tablas Principales

#### 1. `profiles` (Extiende auth.users)
```sql
- id: uuid (PK, FK a auth.users)
- email: text
- phone: text
- display_name: text
- legal_name: text (opcional)
- bio: text
- avatar_url: text
- is_creator: boolean
- created_at: timestamptz
- updated_at: timestamptz
```

#### 2. `works` (Obras/TBTs)
```sql
- id: uuid (PK)
- tbt_id: text (UNIQUE, ej: "TBT-2024-XXXX")
- creator_id: uuid (FK a profiles)
- current_owner_id: uuid (FK a profiles)
- title: text
- description: text
- category: text (pintura, escultura, digital, etc.)
- technique: text
- media_url: text (URL en Supabase Storage)
- ipfs_hash: text (opcional)
- status: enum ('draft', 'certified', 'transferred', 'archived')
- created_at: timestamptz
- certified_at: timestamptz
- blockchain_hash: text (opcional para MVP)
```

#### 3. `work_commerce` (Configuración Comercial)
```sql
- id: uuid (PK)
- work_id: uuid (FK a works, UNIQUE)
- initial_price: decimal
- currency: text (default: 'USD')
- royalty_type: enum ('fixed', 'percentage')
- royalty_value: decimal
- is_for_sale: boolean
- created_at: timestamptz
- updated_at: timestamptz
```

#### 4. `work_context` (Contexto AI)
```sql
- id: uuid (PK)
- work_id: uuid (FK a works, UNIQUE)
- ai_summary: text
- keywords: text[] (array)
- geographical_location: jsonb
- creation_timestamp: timestamptz
- news_headlines: text[]
- is_confirmed: boolean
- created_at: timestamptz
- updated_at: timestamptz
```

#### 5. `transfers` (Historial de Transferencias)
```sql
- id: uuid (PK)
- work_id: uuid (FK a works)
- from_owner_id: uuid (FK a profiles)
- to_owner_id: uuid (FK a profiles)
- transfer_type: enum ('automatic', 'manual', 'gift')
- sale_price: decimal
- royalty_amount: decimal
- royalty_paid: boolean
- payment_reference: text
- payment_link: text
- status: enum ('pending', 'payment_pending', 'completed', 'cancelled')
- initiated_at: timestamptz
- completed_at: timestamptz
```

#### 6. `certificates` (Certificados Generados)
```sql
- id: uuid (PK)
- work_id: uuid (FK a works)
- owner_id: uuid (FK a profiles)
- certificate_url: text
- qr_code_data: text
- version: integer
- generated_at: timestamptz
- valid_until: timestamptz (nullable)
```

#### 7. `plagiarism_scans` (Escaneos de Plagio)
```sql
- id: uuid (PK)
- work_id: uuid (FK a works)
- scan_result: jsonb
- similarity_score: decimal
- flagged_items: jsonb[]
- scanned_at: timestamptz
```

#### 8. `alerts` (Notificaciones/Alertas)
```sql
- id: uuid (PK)
- user_id: uuid (FK a profiles)
- work_id: uuid (FK a works, nullable)
- type: enum ('plagiarism', 'view', 'transfer_request', 'payment', 'system')
- title: text
- message: text
- is_read: boolean
- created_at: timestamptz
```

---

## 🔐 Políticas de Seguridad (RLS)

### Reglas Principales:
1. **profiles**: Usuarios pueden ver todos, editar solo el propio
2. **works**: Creador y propietario actual pueden editar, todos pueden ver obras certificadas
3. **transfers**: Solo participantes pueden ver/iniciar transferencias
4. **certificates**: Públicos para verificación

---

## 📝 Formularios Supaforms

### Form 1: Registro de Artista
- Email/Teléfono
- Nombre para mostrar
- Nombre legal (opcional)
- Bio corta
- Avatar

### Form 2: Creación de Obra
**Sección 1 - La Obra:**
- Título
- Descripción
- Categoría/Técnica
- Imagen/Media

**Sección 2 - Comercio:**
- Precio inicial
- Tipo de regalía (fija/porcentaje)
- Valor de regalía
- ¿Está en venta?

### Form 3: Transferencia Manual
- TBT ID de la obra
- Email/Teléfono del nuevo propietario
- Precio de venta (para cálculo de regalía)
- Notas adicionales

---

## 🚀 Fases de Desarrollo

### FASE 1: Fundación (Semana 1-2)
- [ ] Crear proyecto en Supabase
- [ ] Configurar autenticación OTP (email + phone)
- [ ] Crear todas las tablas
- [ ] Configurar Storage para medios
- [ ] Crear políticas RLS básicas

### FASE 2: Formularios (Semana 2-3)
- [ ] Diseñar formularios en Supaforms
- [ ] Conectar Supaforms con Supabase
- [ ] Probar flujo de registro
- [ ] Probar flujo de creación de obra

### FASE 3: Aplicación Web (Semana 3-5)
- [ ] Crear proyecto Next.js
- [ ] Implementar autenticación
- [ ] Dashboard de artista
- [ ] Página de obra individual
- [ ] Sistema de certificados

### FASE 4: Transferencias (Semana 5-6)
- [ ] Flujo de transferencia manual
- [ ] Cálculo de regalías
- [ ] Integración con pasarela de pago
- [ ] Actualización de certificados

### FASE 5: Verificación Pública (Semana 6-7)
- [ ] Página tbt.cafe/work/[TBT-ID]
- [ ] Generación de QR codes
- [ ] Certificados visuales
- [ ] API pública de verificación

### FASE 6: Inteligencia (Semana 7-8)
- [ ] Integración AI para contexto
- [ ] Sistema de alertas
- [ ] Escaneo básico de plagio (opcional)

---

## 🔗 URLs del Proyecto

- **Verificación**: `tbt.cafe/work/[TBT-ID]`
- **Dashboard**: `tbt.cafe/dashboard`
- **Perfil público**: `tbt.cafe/artist/[username]`
- **Certificado**: `tbt.cafe/certificate/[cert-id]`

---

## 📱 MVP Mínimo

Para el primer lanzamiento con BROCHA:

1. ✅ Autenticación por email
2. ✅ Crear obra con metadata básica
3. ✅ Subir imagen
4. ✅ Generar TBT ID único
5. ✅ Página de verificación pública
6. ✅ Certificado visual básico
7. ✅ Transferencia manual con regalías

---

## 🛠️ Stack Tecnológico Recomendado

| Componente | Tecnología |
|------------|------------|
| Base de Datos | Supabase (PostgreSQL) |
| Autenticación | Supabase Auth (OTP) |
| Storage | Supabase Storage |
| Formularios | Supaforms |
| Frontend | Next.js 14+ |
| Estilos | Tailwind CSS |
| Pagos | Transb.it API |
| QR Codes | qrcode.js |
| PDF Certs | @react-pdf/renderer |

---

## 📞 Siguiente Paso

¿Empezamos con la configuración de Supabase?
- Crear las tablas
- Configurar autenticación
- Preparar el storage

