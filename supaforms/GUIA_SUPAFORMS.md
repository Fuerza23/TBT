# Guía de Configuración de Supaforms para TBT

## 📋 Formularios Necesarios

---

## Formulario 1: Registro de Artista/Usuario

### Configuración del Form
- **Nombre**: `tbt-registro-artista`
- **Tabla destino**: `profiles`
- **Campos**:

| Campo | Tipo | Requerido | Notas |
|-------|------|-----------|-------|
| display_name | Text | ✅ | Nombre artístico o cómo quieres que te conozcan |
| legal_name | Text | ❌ | Nombre legal (opcional, para certificados formales) |
| email | Email | ✅ | Para autenticación y comunicaciones |
| phone | Phone | ❌ | Número telefónico (para MMS/SMS) |
| bio | Textarea | ❌ | Cuéntanos sobre ti y tu arte |
| avatar_url | File Upload | ❌ | Foto de perfil |

### Flujo Post-Submit
1. Crear usuario en Supabase Auth
2. El trigger automáticamente crea el perfil
3. Enviar email de confirmación

---

## Formulario 2: Creación de Obra (TBT)

### Configuración del Form
- **Nombre**: `tbt-crear-obra`
- **Requiere autenticación**: ✅
- **Multi-step**: ✅ (4 pasos)

### Paso 1: La Obra
| Campo | Tipo | Requerido | Notas |
|-------|------|-----------|-------|
| title | Text | ✅ | Título de la obra |
| description | Textarea | ✅ | Descripción detallada |
| category | Select | ✅ | Pintura, Escultura, Digital, Fotografía, Mixta, Otra |
| technique | Text | ❌ | Técnica utilizada (ej: óleo sobre lienzo) |
| media | File Upload | ✅ | Imagen principal de la obra |

### Paso 2: Comercio
| Campo | Tipo | Requerido | Notas |
|-------|------|-----------|-------|
| initial_price | Number | ✅ | Precio inicial en USD |
| royalty_type | Select | ✅ | "Porcentaje" o "Monto Fijo" |
| royalty_value | Number | ✅ | Valor de regalía (% o monto fijo) |
| is_for_sale | Checkbox | ❌ | ¿Está disponible para venta? |

### Paso 3: Contexto (Generado automáticamente)
| Campo | Tipo | Requerido | Notas |
|-------|------|-----------|-------|
| keywords | Tags | ❌ | Palabras clave (auto-sugeridas por AI) |
| geographical_location | Location | ❌ | Ubicación de creación |
| creation_notes | Textarea | ❌ | Notas adicionales sobre el contexto |

### Paso 4: Confirmación
- Vista previa de la información
- Checkbox de términos y condiciones
- Botón de certificar

### Lógica de Backend (Supabase Functions)
```javascript
// Edge Function: create-tbt
async function createTBT(formData, userId) {
    // 1. Crear registro en 'works'
    const work = await supabase
        .from('works')
        .insert({
            creator_id: userId,
            current_owner_id: userId,
            title: formData.title,
            description: formData.description,
            category: formData.category,
            technique: formData.technique,
            media_url: formData.media_url,
            status: 'draft'
        })
        .select()
        .single();
    
    // 2. Crear registro en 'work_commerce'
    await supabase
        .from('work_commerce')
        .insert({
            work_id: work.id,
            initial_price: formData.initial_price,
            royalty_type: formData.royalty_type,
            royalty_value: formData.royalty_value,
            is_for_sale: formData.is_for_sale
        });
    
    // 3. Crear registro en 'work_context'
    await supabase
        .from('work_context')
        .insert({
            work_id: work.id,
            keywords: formData.keywords,
            geographical_location: formData.location,
            is_confirmed: false
        });
    
    // 4. Generar certificado inicial
    await generateCertificate(work.id, userId);
    
    // 5. Cambiar status a 'certified'
    await supabase
        .from('works')
        .update({ 
            status: 'certified',
            certified_at: new Date().toISOString()
        })
        .eq('id', work.id);
    
    return work;
}
```

---

## Formulario 3: Transferencia de Obra

### Configuración del Form
- **Nombre**: `tbt-transferir-obra`
- **Requiere autenticación**: ✅

### Campos
| Campo | Tipo | Requerido | Notas |
|-------|------|-----------|-------|
| tbt_id | Text | ✅ | ID del TBT a transferir (TBT-XXXX-XXXXXX) |
| to_email | Email | ✅ | Email del nuevo propietario |
| to_phone | Phone | ❌ | Teléfono del nuevo propietario |
| transfer_type | Select | ✅ | "Venta" o "Regalo" |
| sale_price | Number | Condicional | Precio de venta (solo si es venta) |
| notes | Textarea | ❌ | Notas adicionales |

### Flujo de Transferencia
```
1. Propietario actual llena formulario
2. Sistema verifica propiedad
3. Sistema calcula regalía
4. Si es venta:
   a. Genera link de pago (Transb.it)
   b. Status = 'payment_pending'
   c. Espera confirmación de pago
   d. Una vez confirmado → completa transferencia
5. Si es regalo:
   a. Crea transferencia con royalty = 0
   b. Completa inmediatamente
6. Actualiza certificado
7. Notifica a ambas partes
```

---

## Formulario 4: Verificación de Obra (Público)

### Configuración del Form
- **Nombre**: `tbt-verificar`
- **Público**: ✅
- **Muy simple**

### Campos
| Campo | Tipo | Requerido | Notas |
|-------|------|-----------|-------|
| tbt_id | Text | ✅ | Ingresa el TBT ID para verificar |

### Resultado
- Muestra página de verificación en `tbt.cafe/work/[TBT-ID]`
- No modifica datos, solo consulta

---

## 🔧 Configuración en Supaforms

### 1. Conectar con Supabase
```
Settings > Integrations > Supabase
- Project URL: [tu-proyecto].supabase.co
- API Key: [tu-anon-key]
```

### 2. Configurar Webhooks (para lógica compleja)
```
Settings > Webhooks
- URL: https://[tu-proyecto].supabase.co/functions/v1/form-handler
- Events: form.submitted
```

### 3. Mapeo de Campos a Tablas

#### Para registro de artista:
```json
{
  "table": "profiles",
  "mapping": {
    "display_name": "display_name",
    "legal_name": "legal_name",
    "bio": "bio"
  },
  "auth": {
    "create_user": true,
    "email_field": "email",
    "phone_field": "phone"
  }
}
```

#### Para creación de obra:
```json
{
  "tables": ["works", "work_commerce", "work_context"],
  "requires_auth": true,
  "custom_function": "create-tbt"
}
```

---

## 📱 Estilos Recomendados

### Tema TBT/BROCHA
```css
:root {
  --tbt-primary: #1a1a2e;      /* Azul oscuro */
  --tbt-secondary: #16213e;    /* Azul profundo */
  --tbt-accent: #e94560;       /* Rojo coral */
  --tbt-gold: #f4a261;         /* Dorado */
  --tbt-light: #eaeaea;        /* Gris claro */
  --tbt-success: #06d6a0;      /* Verde éxito */
}
```

### Tipografía
- **Títulos**: Playfair Display o similar serif elegante
- **Cuerpo**: Inter o similar sans-serif limpia

---

## 🔗 URLs de Formularios

| Formulario | URL Sugerida |
|------------|--------------|
| Registro | tbt.cafe/registro |
| Crear Obra | tbt.cafe/crear |
| Transferir | tbt.cafe/transferir |
| Verificar | tbt.cafe/verificar |

---

## ✅ Checklist de Implementación

- [ ] Crear formulario de registro en Supaforms
- [ ] Configurar autenticación OTP en Supabase
- [ ] Probar flujo de registro completo
- [ ] Crear formulario de creación de obra
- [ ] Configurar upload de archivos a Supabase Storage
- [ ] Crear Edge Function para generación de TBT
- [ ] Crear formulario de transferencia
- [ ] Integrar con sistema de pagos (Transb.it)
- [ ] Crear formulario/página de verificación
- [ ] Probar flujo completo end-to-end
