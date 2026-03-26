--
-- PostgreSQL database dump
--

\restrict 02qE9b0XttGWx7OdrmHgjGFOr8K8verIozWFDZaG5fsaVfjxL35KpVvDLPr0yg2

-- Dumped from database version 17.9
-- Dumped by pg_dump version 17.9

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: cache; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cache (
    key character varying(255) NOT NULL,
    value text NOT NULL,
    expiration integer NOT NULL
);


--
-- Name: cache_locks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cache_locks (
    key character varying(255) NOT NULL,
    owner character varying(255) NOT NULL,
    expiration integer NOT NULL
);


--
-- Name: correlativos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.correlativos (
    id bigint NOT NULL,
    anio integer NOT NULL,
    ultimo_numero integer DEFAULT 0,
    activo smallint DEFAULT 1,
    tipo_correlativo_id integer NOT NULL,
    servicio_id integer,
    codigo_servicio character varying(50) NOT NULL
);


--
-- Name: correlativos_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.correlativos_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: correlativos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.correlativos_id_seq OWNED BY public.correlativos.id;


--
-- Name: documentos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.documentos (
    id bigint NOT NULL,
    modelo_tipo character varying(255) NOT NULL,
    modelo_id bigint NOT NULL,
    tipo_documento character varying(100) NOT NULL,
    nombre_original character varying(255) NOT NULL,
    ruta_archivo character varying(500) NOT NULL,
    peso_bytes bigint,
    activo smallint DEFAULT 1,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    tipo_documento_id bigint
);


--
-- Name: documentos_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.documentos_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: documentos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.documentos_id_seq OWNED BY public.documentos.id;


--
-- Name: etapas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.etapas (
    id bigint NOT NULL,
    servicio_id bigint NOT NULL,
    nombre character varying(255) NOT NULL,
    descripcion text,
    orden integer NOT NULL,
    activo smallint DEFAULT 1,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: etapas_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.etapas_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: etapas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.etapas_id_seq OWNED BY public.etapas.id;


--
-- Name: expediente_actores; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.expediente_actores (
    id bigint NOT NULL,
    expediente_id bigint NOT NULL,
    usuario_id bigint,
    tipo_actor_id integer NOT NULL,
    activo smallint DEFAULT 1,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    nombre_externo character varying(255),
    email_externo character varying(255),
    es_gestor boolean DEFAULT false NOT NULL
);


--
-- Name: expediente_actores_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.expediente_actores_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: expediente_actores_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.expediente_actores_id_seq OWNED BY public.expediente_actores.id;


--
-- Name: expediente_historial; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.expediente_historial (
    id bigint NOT NULL,
    expediente_id bigint NOT NULL,
    usuario_id bigint NOT NULL,
    tipo_evento character varying(50) NOT NULL,
    descripcion text NOT NULL,
    datos_extra jsonb,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: expediente_historial_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.expediente_historial_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: expediente_historial_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.expediente_historial_id_seq OWNED BY public.expediente_historial.id;


--
-- Name: expediente_movimientos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.expediente_movimientos (
    id bigint NOT NULL,
    expediente_id bigint NOT NULL,
    etapa_id bigint,
    sub_etapa_id bigint,
    tipo_actor_responsable_id integer,
    usuario_responsable_id bigint,
    creado_por bigint NOT NULL,
    instruccion text NOT NULL,
    observaciones text,
    respuesta text,
    dias_plazo integer,
    fecha_limite date,
    fecha_respuesta timestamp without time zone,
    respondido_por bigint,
    estado character varying(20) DEFAULT 'pendiente'::character varying NOT NULL,
    activo boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    tipo_documento_requerido_id bigint,
    resolucion_tipo_id bigint,
    resolucion_nota text,
    resuelto_por bigint,
    fecha_resolucion timestamp without time zone,
    CONSTRAINT expediente_movimientos_estado_check CHECK (((estado)::text = ANY ((ARRAY['pendiente'::character varying, 'respondido'::character varying, 'recibido'::character varying, 'vencido'::character varying, 'omitido'::character varying])::text[])))
);


--
-- Name: expediente_movimientos_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.expediente_movimientos_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: expediente_movimientos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.expediente_movimientos_id_seq OWNED BY public.expediente_movimientos.id;


--
-- Name: expedientes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.expedientes (
    id bigint NOT NULL,
    solicitud_id bigint NOT NULL,
    servicio_id bigint NOT NULL,
    numero_expediente character varying(100),
    etapa_actual_id bigint,
    estado character varying(50) DEFAULT 'activo'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: expedientes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.expedientes_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: expedientes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.expedientes_id_seq OWNED BY public.expedientes.id;


--
-- Name: failed_jobs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.failed_jobs (
    id bigint NOT NULL,
    uuid character varying(255) NOT NULL,
    connection text NOT NULL,
    queue text NOT NULL,
    payload text NOT NULL,
    exception text NOT NULL,
    failed_at timestamp(0) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: failed_jobs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.failed_jobs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: failed_jobs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.failed_jobs_id_seq OWNED BY public.failed_jobs.id;


--
-- Name: job_batches; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.job_batches (
    id character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    total_jobs integer NOT NULL,
    pending_jobs integer NOT NULL,
    failed_jobs integer NOT NULL,
    failed_job_ids text NOT NULL,
    options text,
    cancelled_at integer,
    created_at integer NOT NULL,
    finished_at integer
);


--
-- Name: jobs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.jobs (
    id bigint NOT NULL,
    queue character varying(255) NOT NULL,
    payload text NOT NULL,
    attempts smallint NOT NULL,
    reserved_at integer,
    available_at integer NOT NULL,
    created_at integer NOT NULL
);


--
-- Name: jobs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.jobs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: jobs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.jobs_id_seq OWNED BY public.jobs.id;


--
-- Name: migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.migrations (
    id integer NOT NULL,
    migration character varying(255) NOT NULL,
    batch integer NOT NULL
);


--
-- Name: migrations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.migrations_id_seq OWNED BY public.migrations.id;


--
-- Name: modules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.modules (
    id bigint NOT NULL,
    nombre character varying(255) NOT NULL,
    slug character varying(255) NOT NULL,
    icono character varying(255),
    ruta character varying(255),
    parent_id bigint,
    orden integer DEFAULT 0,
    activo smallint DEFAULT 1,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: modules_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.modules_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: modules_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.modules_id_seq OWNED BY public.modules.id;


--
-- Name: movimiento_documentos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.movimiento_documentos (
    id bigint NOT NULL,
    movimiento_id bigint NOT NULL,
    tipo_documento_id bigint,
    subido_por bigint NOT NULL,
    nombre_original character varying(255) NOT NULL,
    ruta_archivo character varying(500) NOT NULL,
    peso_bytes bigint,
    momento character varying(20) DEFAULT 'creacion'::character varying NOT NULL,
    activo boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT movimiento_documentos_momento_check CHECK (((momento)::text = ANY ((ARRAY['creacion'::character varying, 'respuesta'::character varying])::text[])))
);


--
-- Name: movimiento_documentos_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.movimiento_documentos_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: movimiento_documentos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.movimiento_documentos_id_seq OWNED BY public.movimiento_documentos.id;


--
-- Name: movimiento_notificaciones; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.movimiento_notificaciones (
    id bigint NOT NULL,
    movimiento_id bigint NOT NULL,
    actor_id bigint,
    email_destino character varying(255) NOT NULL,
    nombre_destino character varying(255),
    asunto character varying(500),
    estado_envio character varying(20) DEFAULT 'pendiente'::character varying NOT NULL,
    enviado_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT movimiento_notificaciones_estado_envio_check CHECK (((estado_envio)::text = ANY ((ARRAY['pendiente'::character varying, 'enviado'::character varying, 'fallido'::character varying])::text[])))
);


--
-- Name: movimiento_notificaciones_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.movimiento_notificaciones_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: movimiento_notificaciones_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.movimiento_notificaciones_id_seq OWNED BY public.movimiento_notificaciones.id;


--
-- Name: password_reset_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.password_reset_tokens (
    email character varying(255) NOT NULL,
    token character varying(255) NOT NULL,
    created_at timestamp(0) without time zone
);


--
-- Name: rol_modulo_permiso; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rol_modulo_permiso (
    id bigint NOT NULL,
    rol_id bigint NOT NULL,
    modulo_id bigint NOT NULL,
    ver smallint DEFAULT 0,
    crear smallint DEFAULT 0,
    editar smallint DEFAULT 0,
    eliminar smallint DEFAULT 0,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: rol_modulo_permiso_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.rol_modulo_permiso_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: rol_modulo_permiso_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.rol_modulo_permiso_id_seq OWNED BY public.rol_modulo_permiso.id;


--
-- Name: roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.roles (
    id bigint NOT NULL,
    nombre character varying(255) NOT NULL,
    descripcion text,
    activo smallint DEFAULT 1,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    slug character varying(100),
    puede_designar_gestor boolean DEFAULT false NOT NULL,
    puede_ver_todos_expedientes boolean DEFAULT false NOT NULL
);


--
-- Name: roles_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.roles_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: roles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.roles_id_seq OWNED BY public.roles.id;


--
-- Name: servicio_tipos_actor; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.servicio_tipos_actor (
    id bigint NOT NULL,
    servicio_id bigint NOT NULL,
    tipo_actor_id integer NOT NULL,
    es_automatico boolean DEFAULT false NOT NULL,
    rol_auto_slug character varying(100),
    orden integer DEFAULT 1 NOT NULL,
    activo smallint DEFAULT 1 NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    permite_externo boolean DEFAULT false NOT NULL
);


--
-- Name: servicio_tipos_actor_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.servicio_tipos_actor_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: servicio_tipos_actor_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.servicio_tipos_actor_id_seq OWNED BY public.servicio_tipos_actor.id;


--
-- Name: servicios; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.servicios (
    id bigint NOT NULL,
    nombre character varying(255) NOT NULL,
    descripcion text,
    activo smallint DEFAULT 1,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    plazo_subsanacion_dias integer DEFAULT 5 NOT NULL,
    plazo_apersonamiento_dias integer DEFAULT 5 NOT NULL
);


--
-- Name: servicios_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.servicios_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: servicios_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.servicios_id_seq OWNED BY public.servicios.id;


--
-- Name: sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sessions (
    id character varying(255) NOT NULL,
    user_id bigint,
    ip_address character varying(45),
    user_agent text,
    payload text NOT NULL,
    last_activity integer NOT NULL
);


--
-- Name: solicitud_subsanaciones; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.solicitud_subsanaciones (
    id bigint NOT NULL,
    solicitud_id bigint NOT NULL,
    registrado_por bigint NOT NULL,
    observacion text NOT NULL,
    plazo_dias integer DEFAULT 5,
    fecha_limite date,
    estado character varying(20) DEFAULT 'pendiente'::character varying NOT NULL,
    respuesta text,
    subsanado_por bigint,
    fecha_subsanacion timestamp without time zone,
    activo boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT solicitud_subsanaciones_estado_check CHECK (((estado)::text = ANY ((ARRAY['pendiente'::character varying, 'subsanado'::character varying, 'vencido'::character varying])::text[])))
);


--
-- Name: solicitud_subsanaciones_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.solicitud_subsanaciones_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: solicitud_subsanaciones_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.solicitud_subsanaciones_id_seq OWNED BY public.solicitud_subsanaciones.id;


--
-- Name: solicitudes_arbitraje; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.solicitudes_arbitraje (
    id bigint NOT NULL,
    servicio_id bigint DEFAULT 1,
    numero_cargo character varying(50),
    usuario_id bigint,
    tipo_persona character varying(20) NOT NULL,
    nombre_demandante character varying(255) NOT NULL,
    documento_demandante character varying(50) NOT NULL,
    nombre_representante character varying(255),
    documento_representante character varying(50),
    domicilio_demandante text NOT NULL,
    email_demandante character varying(255) NOT NULL,
    telefono_demandante character varying(50),
    nombre_demandado character varying(255) NOT NULL,
    domicilio_demandado text,
    email_demandado character varying(255),
    telefono_demandado character varying(50),
    resumen_controversia text NOT NULL,
    pretensiones text NOT NULL,
    monto_involucrado numeric(15,2),
    solicita_designacion_director smallint DEFAULT 0,
    nombre_arbitro_propuesto character varying(255),
    email_arbitro_propuesto character varying(255),
    domicilio_arbitro_propuesto text,
    reglas_aplicables text,
    estado character varying(50) DEFAULT 'Pendiente'::character varying,
    activo smallint DEFAULT 1,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    resultado_revision character varying(20),
    fecha_revision timestamp without time zone,
    revisado_por bigint,
    motivo_no_conformidad text,
    documento_demandado character varying(20),
    tipo_persona_demandado character varying(20) DEFAULT 'natural'::character varying,
    tipo_documento character varying(10) DEFAULT 'dni'::character varying,
    tipo_documento_demandado character varying(10) DEFAULT 'dni'::character varying
);


--
-- Name: solicitudes_arbitraje_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.solicitudes_arbitraje_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: solicitudes_arbitraje_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.solicitudes_arbitraje_id_seq OWNED BY public.solicitudes_arbitraje.id;


--
-- Name: sub_etapas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sub_etapas (
    id bigint NOT NULL,
    etapa_id bigint NOT NULL,
    nombre character varying(255) NOT NULL,
    descripcion text,
    orden integer DEFAULT 1 NOT NULL,
    activo smallint DEFAULT 1 NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: sub_etapas_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sub_etapas_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: sub_etapas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.sub_etapas_id_seq OWNED BY public.sub_etapas.id;


--
-- Name: tipo_documentos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tipo_documentos (
    id bigint NOT NULL,
    nombre character varying(150) NOT NULL,
    slug character varying(100) NOT NULL,
    descripcion text,
    aplica_para character varying(20) DEFAULT 'ambos'::character varying NOT NULL,
    activo boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    formatos_permitidos character varying(255) DEFAULT 'pdf,doc,docx'::character varying,
    tamanio_maximo_mb integer DEFAULT 10
);


--
-- Name: tipo_documentos_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.tipo_documentos_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: tipo_documentos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.tipo_documentos_id_seq OWNED BY public.tipo_documentos.id;


--
-- Name: tipos_actor_expediente; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tipos_actor_expediente (
    id integer NOT NULL,
    nombre character varying(100) NOT NULL,
    slug character varying(100) NOT NULL,
    activo smallint DEFAULT 1
);


--
-- Name: tipos_actor_expediente_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.tipos_actor_expediente_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: tipos_actor_expediente_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.tipos_actor_expediente_id_seq OWNED BY public.tipos_actor_expediente.id;


--
-- Name: tipos_correlativo; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tipos_correlativo (
    id integer NOT NULL,
    nombre character varying(100) NOT NULL,
    codigo character varying(20) NOT NULL,
    prefijo character varying(50) DEFAULT ''::character varying NOT NULL,
    aplica_sufijo_centro boolean DEFAULT true NOT NULL,
    activo boolean DEFAULT true NOT NULL
);


--
-- Name: tipos_correlativo_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.tipos_correlativo_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: tipos_correlativo_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.tipos_correlativo_id_seq OWNED BY public.tipos_correlativo.id;


--
-- Name: tipos_resolucion_movimiento; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tipos_resolucion_movimiento (
    id bigint NOT NULL,
    nombre character varying(100) NOT NULL,
    descripcion text,
    color character varying(20) DEFAULT 'gray'::character varying NOT NULL,
    requiere_nota boolean DEFAULT false NOT NULL,
    activo boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: tipos_resolucion_movimiento_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.tipos_resolucion_movimiento_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: tipos_resolucion_movimiento_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.tipos_resolucion_movimiento_id_seq OWNED BY public.tipos_resolucion_movimiento.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id bigint NOT NULL,
    name character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    email_verified_at timestamp(0) without time zone,
    password character varying(255) NOT NULL,
    remember_token character varying(100),
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    rol_id bigint,
    activo smallint DEFAULT 1,
    tipo_persona character varying(20),
    numero_documento character varying(50),
    telefono character varying(20),
    direccion text
);


--
-- Name: COLUMN users.tipo_persona; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.users.tipo_persona IS 'natural o juridica';


--
-- Name: COLUMN users.numero_documento; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.users.numero_documento IS 'DNI, CE o RUC';


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: verification_codes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.verification_codes (
    id bigint NOT NULL,
    email character varying(255) NOT NULL,
    codigo character varying(6) NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    usado boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone,
    updated_at timestamp without time zone
);


--
-- Name: verification_codes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.verification_codes_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: verification_codes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.verification_codes_id_seq OWNED BY public.verification_codes.id;


--
-- Name: correlativos id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.correlativos ALTER COLUMN id SET DEFAULT nextval('public.correlativos_id_seq'::regclass);


--
-- Name: documentos id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.documentos ALTER COLUMN id SET DEFAULT nextval('public.documentos_id_seq'::regclass);


--
-- Name: etapas id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.etapas ALTER COLUMN id SET DEFAULT nextval('public.etapas_id_seq'::regclass);


--
-- Name: expediente_actores id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expediente_actores ALTER COLUMN id SET DEFAULT nextval('public.expediente_actores_id_seq'::regclass);


--
-- Name: expediente_historial id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expediente_historial ALTER COLUMN id SET DEFAULT nextval('public.expediente_historial_id_seq'::regclass);


--
-- Name: expediente_movimientos id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expediente_movimientos ALTER COLUMN id SET DEFAULT nextval('public.expediente_movimientos_id_seq'::regclass);


--
-- Name: expedientes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expedientes ALTER COLUMN id SET DEFAULT nextval('public.expedientes_id_seq'::regclass);


--
-- Name: failed_jobs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.failed_jobs ALTER COLUMN id SET DEFAULT nextval('public.failed_jobs_id_seq'::regclass);


--
-- Name: jobs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.jobs ALTER COLUMN id SET DEFAULT nextval('public.jobs_id_seq'::regclass);


--
-- Name: migrations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.migrations ALTER COLUMN id SET DEFAULT nextval('public.migrations_id_seq'::regclass);


--
-- Name: modules id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.modules ALTER COLUMN id SET DEFAULT nextval('public.modules_id_seq'::regclass);


--
-- Name: movimiento_documentos id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.movimiento_documentos ALTER COLUMN id SET DEFAULT nextval('public.movimiento_documentos_id_seq'::regclass);


--
-- Name: movimiento_notificaciones id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.movimiento_notificaciones ALTER COLUMN id SET DEFAULT nextval('public.movimiento_notificaciones_id_seq'::regclass);


--
-- Name: rol_modulo_permiso id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rol_modulo_permiso ALTER COLUMN id SET DEFAULT nextval('public.rol_modulo_permiso_id_seq'::regclass);


--
-- Name: roles id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles ALTER COLUMN id SET DEFAULT nextval('public.roles_id_seq'::regclass);


--
-- Name: servicio_tipos_actor id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.servicio_tipos_actor ALTER COLUMN id SET DEFAULT nextval('public.servicio_tipos_actor_id_seq'::regclass);


--
-- Name: servicios id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.servicios ALTER COLUMN id SET DEFAULT nextval('public.servicios_id_seq'::regclass);


--
-- Name: solicitud_subsanaciones id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.solicitud_subsanaciones ALTER COLUMN id SET DEFAULT nextval('public.solicitud_subsanaciones_id_seq'::regclass);


--
-- Name: solicitudes_arbitraje id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.solicitudes_arbitraje ALTER COLUMN id SET DEFAULT nextval('public.solicitudes_arbitraje_id_seq'::regclass);


--
-- Name: sub_etapas id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sub_etapas ALTER COLUMN id SET DEFAULT nextval('public.sub_etapas_id_seq'::regclass);


--
-- Name: tipo_documentos id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tipo_documentos ALTER COLUMN id SET DEFAULT nextval('public.tipo_documentos_id_seq'::regclass);


--
-- Name: tipos_actor_expediente id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tipos_actor_expediente ALTER COLUMN id SET DEFAULT nextval('public.tipos_actor_expediente_id_seq'::regclass);


--
-- Name: tipos_correlativo id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tipos_correlativo ALTER COLUMN id SET DEFAULT nextval('public.tipos_correlativo_id_seq'::regclass);


--
-- Name: tipos_resolucion_movimiento id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tipos_resolucion_movimiento ALTER COLUMN id SET DEFAULT nextval('public.tipos_resolucion_movimiento_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: verification_codes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.verification_codes ALTER COLUMN id SET DEFAULT nextval('public.verification_codes_id_seq'::regclass);


--
-- Name: documentos documentos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.documentos
    ADD CONSTRAINT documentos_pkey PRIMARY KEY (id);


--
-- Name: etapas etapas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.etapas
    ADD CONSTRAINT etapas_pkey PRIMARY KEY (id);


--
-- Name: expediente_actores expediente_actores_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expediente_actores
    ADD CONSTRAINT expediente_actores_pkey PRIMARY KEY (id);


--
-- Name: expediente_historial expediente_historial_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expediente_historial
    ADD CONSTRAINT expediente_historial_pkey PRIMARY KEY (id);


--
-- Name: expediente_movimientos expediente_movimientos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expediente_movimientos
    ADD CONSTRAINT expediente_movimientos_pkey PRIMARY KEY (id);


--
-- Name: expedientes expedientes_numero_expediente_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expedientes
    ADD CONSTRAINT expedientes_numero_expediente_key UNIQUE (numero_expediente);


--
-- Name: expedientes expedientes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expedientes
    ADD CONSTRAINT expedientes_pkey PRIMARY KEY (id);


--
-- Name: expedientes expedientes_solicitud_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expedientes
    ADD CONSTRAINT expedientes_solicitud_id_key UNIQUE (solicitud_id);


--
-- Name: modules modules_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.modules
    ADD CONSTRAINT modules_pkey PRIMARY KEY (id);


--
-- Name: movimiento_documentos movimiento_documentos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.movimiento_documentos
    ADD CONSTRAINT movimiento_documentos_pkey PRIMARY KEY (id);


--
-- Name: movimiento_notificaciones movimiento_notificaciones_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.movimiento_notificaciones
    ADD CONSTRAINT movimiento_notificaciones_pkey PRIMARY KEY (id);


--
-- Name: rol_modulo_permiso rol_modulo_permiso_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rol_modulo_permiso
    ADD CONSTRAINT rol_modulo_permiso_pkey PRIMARY KEY (id);


--
-- Name: rol_modulo_permiso rol_modulo_permiso_rol_id_modulo_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rol_modulo_permiso
    ADD CONSTRAINT rol_modulo_permiso_rol_id_modulo_id_key UNIQUE (rol_id, modulo_id);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: servicio_tipos_actor servicio_tipos_actor_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.servicio_tipos_actor
    ADD CONSTRAINT servicio_tipos_actor_pkey PRIMARY KEY (id);


--
-- Name: servicio_tipos_actor servicio_tipos_actor_servicio_id_tipo_actor_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.servicio_tipos_actor
    ADD CONSTRAINT servicio_tipos_actor_servicio_id_tipo_actor_id_key UNIQUE (servicio_id, tipo_actor_id);


--
-- Name: servicios servicios_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.servicios
    ADD CONSTRAINT servicios_pkey PRIMARY KEY (id);


--
-- Name: solicitud_subsanaciones solicitud_subsanaciones_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.solicitud_subsanaciones
    ADD CONSTRAINT solicitud_subsanaciones_pkey PRIMARY KEY (id);


--
-- Name: solicitudes_arbitraje solicitudes_arbitraje_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.solicitudes_arbitraje
    ADD CONSTRAINT solicitudes_arbitraje_pkey PRIMARY KEY (id);


--
-- Name: sub_etapas sub_etapas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sub_etapas
    ADD CONSTRAINT sub_etapas_pkey PRIMARY KEY (id);


--
-- Name: tipo_documentos tipo_documentos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tipo_documentos
    ADD CONSTRAINT tipo_documentos_pkey PRIMARY KEY (id);


--
-- Name: tipo_documentos tipo_documentos_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tipo_documentos
    ADD CONSTRAINT tipo_documentos_slug_key UNIQUE (slug);


--
-- Name: tipos_actor_expediente tipos_actor_expediente_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tipos_actor_expediente
    ADD CONSTRAINT tipos_actor_expediente_pkey PRIMARY KEY (id);


--
-- Name: tipos_actor_expediente tipos_actor_expediente_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tipos_actor_expediente
    ADD CONSTRAINT tipos_actor_expediente_slug_key UNIQUE (slug);


--
-- Name: tipos_correlativo tipos_correlativo_codigo_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tipos_correlativo
    ADD CONSTRAINT tipos_correlativo_codigo_key UNIQUE (codigo);


--
-- Name: tipos_correlativo tipos_correlativo_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tipos_correlativo
    ADD CONSTRAINT tipos_correlativo_pkey PRIMARY KEY (id);


--
-- Name: tipos_resolucion_movimiento tipos_resolucion_movimiento_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tipos_resolucion_movimiento
    ADD CONSTRAINT tipos_resolucion_movimiento_pkey PRIMARY KEY (id);


--
-- Name: expediente_actores unq_expediente_actor; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expediente_actores
    ADD CONSTRAINT unq_expediente_actor UNIQUE (expediente_id, usuario_id, tipo_actor_id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: verification_codes verification_codes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.verification_codes
    ADD CONSTRAINT verification_codes_pkey PRIMARY KEY (id);


--
-- Name: idx_documentos_modelo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_documentos_modelo ON public.documentos USING btree (modelo_tipo, modelo_id);


--
-- Name: idx_historial_expediente; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_historial_expediente ON public.expediente_historial USING btree (expediente_id);


--
-- Name: idx_mov_estado; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_mov_estado ON public.expediente_movimientos USING btree (estado);


--
-- Name: idx_mov_expediente; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_mov_expediente ON public.expediente_movimientos USING btree (expediente_id);


--
-- Name: idx_mov_fecha_limite; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_mov_fecha_limite ON public.expediente_movimientos USING btree (fecha_limite) WHERE ((estado)::text = 'pendiente'::text);


--
-- Name: idx_mov_responsable; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_mov_responsable ON public.expediente_movimientos USING btree (usuario_responsable_id);


--
-- Name: idx_movdoc_movimiento; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_movdoc_movimiento ON public.movimiento_documentos USING btree (movimiento_id);


--
-- Name: idx_movnotif_movimiento; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_movnotif_movimiento ON public.movimiento_notificaciones USING btree (movimiento_id);


--
-- Name: idx_sub_etapas_etapa; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sub_etapas_etapa ON public.sub_etapas USING btree (etapa_id);


--
-- Name: idx_subsanacion_solicitud; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_subsanacion_solicitud ON public.solicitud_subsanaciones USING btree (solicitud_id);


--
-- Name: idx_verification_codes_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_verification_codes_email ON public.verification_codes USING btree (email);


--
-- Name: uidx_correlativo_con_servicio; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uidx_correlativo_con_servicio ON public.correlativos USING btree (tipo_correlativo_id, servicio_id, anio) WHERE (servicio_id IS NOT NULL);


--
-- Name: uidx_correlativo_global; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uidx_correlativo_global ON public.correlativos USING btree (tipo_correlativo_id, anio) WHERE (servicio_id IS NULL);


--
-- Name: correlativos correlativos_servicio_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.correlativos
    ADD CONSTRAINT correlativos_servicio_id_fkey FOREIGN KEY (servicio_id) REFERENCES public.servicios(id);


--
-- Name: correlativos correlativos_tipo_correlativo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.correlativos
    ADD CONSTRAINT correlativos_tipo_correlativo_id_fkey FOREIGN KEY (tipo_correlativo_id) REFERENCES public.tipos_correlativo(id);


--
-- Name: documentos documentos_tipo_documento_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.documentos
    ADD CONSTRAINT documentos_tipo_documento_id_fkey FOREIGN KEY (tipo_documento_id) REFERENCES public.tipo_documentos(id);


--
-- Name: expediente_historial expediente_historial_expediente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expediente_historial
    ADD CONSTRAINT expediente_historial_expediente_id_fkey FOREIGN KEY (expediente_id) REFERENCES public.expedientes(id) ON DELETE CASCADE;


--
-- Name: expediente_historial expediente_historial_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expediente_historial
    ADD CONSTRAINT expediente_historial_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.users(id);


--
-- Name: expediente_movimientos expediente_movimientos_creado_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expediente_movimientos
    ADD CONSTRAINT expediente_movimientos_creado_por_fkey FOREIGN KEY (creado_por) REFERENCES public.users(id);


--
-- Name: expediente_movimientos expediente_movimientos_etapa_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expediente_movimientos
    ADD CONSTRAINT expediente_movimientos_etapa_id_fkey FOREIGN KEY (etapa_id) REFERENCES public.etapas(id);


--
-- Name: expediente_movimientos expediente_movimientos_expediente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expediente_movimientos
    ADD CONSTRAINT expediente_movimientos_expediente_id_fkey FOREIGN KEY (expediente_id) REFERENCES public.expedientes(id) ON DELETE CASCADE;


--
-- Name: expediente_movimientos expediente_movimientos_resolucion_tipo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expediente_movimientos
    ADD CONSTRAINT expediente_movimientos_resolucion_tipo_id_fkey FOREIGN KEY (resolucion_tipo_id) REFERENCES public.tipos_resolucion_movimiento(id);


--
-- Name: expediente_movimientos expediente_movimientos_respondido_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expediente_movimientos
    ADD CONSTRAINT expediente_movimientos_respondido_por_fkey FOREIGN KEY (respondido_por) REFERENCES public.users(id);


--
-- Name: expediente_movimientos expediente_movimientos_resuelto_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expediente_movimientos
    ADD CONSTRAINT expediente_movimientos_resuelto_por_fkey FOREIGN KEY (resuelto_por) REFERENCES public.users(id);


--
-- Name: expediente_movimientos expediente_movimientos_sub_etapa_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expediente_movimientos
    ADD CONSTRAINT expediente_movimientos_sub_etapa_id_fkey FOREIGN KEY (sub_etapa_id) REFERENCES public.sub_etapas(id);


--
-- Name: expediente_movimientos expediente_movimientos_tipo_actor_responsable_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expediente_movimientos
    ADD CONSTRAINT expediente_movimientos_tipo_actor_responsable_id_fkey FOREIGN KEY (tipo_actor_responsable_id) REFERENCES public.tipos_actor_expediente(id);


--
-- Name: expediente_movimientos expediente_movimientos_tipo_documento_requerido_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expediente_movimientos
    ADD CONSTRAINT expediente_movimientos_tipo_documento_requerido_id_fkey FOREIGN KEY (tipo_documento_requerido_id) REFERENCES public.tipo_documentos(id);


--
-- Name: expediente_movimientos expediente_movimientos_usuario_responsable_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expediente_movimientos
    ADD CONSTRAINT expediente_movimientos_usuario_responsable_id_fkey FOREIGN KEY (usuario_responsable_id) REFERENCES public.users(id);


--
-- Name: expediente_actores fk_actor_expediente; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expediente_actores
    ADD CONSTRAINT fk_actor_expediente FOREIGN KEY (expediente_id) REFERENCES public.expedientes(id) ON DELETE CASCADE;


--
-- Name: expediente_actores fk_actor_tipo; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expediente_actores
    ADD CONSTRAINT fk_actor_tipo FOREIGN KEY (tipo_actor_id) REFERENCES public.tipos_actor_expediente(id);


--
-- Name: expediente_actores fk_actor_usuario; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expediente_actores
    ADD CONSTRAINT fk_actor_usuario FOREIGN KEY (usuario_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: expedientes fk_expediente_etapa; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expedientes
    ADD CONSTRAINT fk_expediente_etapa FOREIGN KEY (etapa_actual_id) REFERENCES public.etapas(id);


--
-- Name: expedientes fk_expediente_servicio; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expedientes
    ADD CONSTRAINT fk_expediente_servicio FOREIGN KEY (servicio_id) REFERENCES public.servicios(id);


--
-- Name: expedientes fk_expediente_solicitud; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expedientes
    ADD CONSTRAINT fk_expediente_solicitud FOREIGN KEY (solicitud_id) REFERENCES public.solicitudes_arbitraje(id) ON DELETE CASCADE;


--
-- Name: movimiento_documentos movimiento_documentos_movimiento_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.movimiento_documentos
    ADD CONSTRAINT movimiento_documentos_movimiento_id_fkey FOREIGN KEY (movimiento_id) REFERENCES public.expediente_movimientos(id) ON DELETE CASCADE;


--
-- Name: movimiento_documentos movimiento_documentos_subido_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.movimiento_documentos
    ADD CONSTRAINT movimiento_documentos_subido_por_fkey FOREIGN KEY (subido_por) REFERENCES public.users(id);


--
-- Name: movimiento_documentos movimiento_documentos_tipo_documento_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.movimiento_documentos
    ADD CONSTRAINT movimiento_documentos_tipo_documento_id_fkey FOREIGN KEY (tipo_documento_id) REFERENCES public.tipo_documentos(id);


--
-- Name: movimiento_notificaciones movimiento_notificaciones_actor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.movimiento_notificaciones
    ADD CONSTRAINT movimiento_notificaciones_actor_id_fkey FOREIGN KEY (actor_id) REFERENCES public.expediente_actores(id);


--
-- Name: movimiento_notificaciones movimiento_notificaciones_movimiento_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.movimiento_notificaciones
    ADD CONSTRAINT movimiento_notificaciones_movimiento_id_fkey FOREIGN KEY (movimiento_id) REFERENCES public.expediente_movimientos(id) ON DELETE CASCADE;


--
-- Name: servicio_tipos_actor servicio_tipos_actor_servicio_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.servicio_tipos_actor
    ADD CONSTRAINT servicio_tipos_actor_servicio_id_fkey FOREIGN KEY (servicio_id) REFERENCES public.servicios(id) ON DELETE CASCADE;


--
-- Name: servicio_tipos_actor servicio_tipos_actor_tipo_actor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.servicio_tipos_actor
    ADD CONSTRAINT servicio_tipos_actor_tipo_actor_id_fkey FOREIGN KEY (tipo_actor_id) REFERENCES public.tipos_actor_expediente(id) ON DELETE CASCADE;


--
-- Name: solicitud_subsanaciones solicitud_subsanaciones_registrado_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.solicitud_subsanaciones
    ADD CONSTRAINT solicitud_subsanaciones_registrado_por_fkey FOREIGN KEY (registrado_por) REFERENCES public.users(id);


--
-- Name: solicitud_subsanaciones solicitud_subsanaciones_solicitud_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.solicitud_subsanaciones
    ADD CONSTRAINT solicitud_subsanaciones_solicitud_id_fkey FOREIGN KEY (solicitud_id) REFERENCES public.solicitudes_arbitraje(id) ON DELETE CASCADE;


--
-- Name: solicitud_subsanaciones solicitud_subsanaciones_subsanado_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.solicitud_subsanaciones
    ADD CONSTRAINT solicitud_subsanaciones_subsanado_por_fkey FOREIGN KEY (subsanado_por) REFERENCES public.users(id);


--
-- Name: solicitudes_arbitraje solicitudes_arbitraje_revisado_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.solicitudes_arbitraje
    ADD CONSTRAINT solicitudes_arbitraje_revisado_por_fkey FOREIGN KEY (revisado_por) REFERENCES public.users(id);


--
-- Name: sub_etapas sub_etapas_etapa_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sub_etapas
    ADD CONSTRAINT sub_etapas_etapa_id_fkey FOREIGN KEY (etapa_id) REFERENCES public.etapas(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict 02qE9b0XttGWx7OdrmHgjGFOr8K8verIozWFDZaG5fsaVfjxL35KpVvDLPr0yg2

--
-- PostgreSQL database dump
--

\restrict oNGz30DlRyypckK2WeQcVzb1udBGMdJdoMWVB6cQQNbXBAFlKvqcghm9J82VmAb

-- Dumped from database version 17.9
-- Dumped by pg_dump version 17.9

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: migrations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.migrations (id, migration, batch) FROM stdin;
\.


--
-- Name: migrations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.migrations_id_seq', 1, false);


--
-- PostgreSQL database dump complete
--

\unrestrict oNGz30DlRyypckK2WeQcVzb1udBGMdJdoMWVB6cQQNbXBAFlKvqcghm9J82VmAb

