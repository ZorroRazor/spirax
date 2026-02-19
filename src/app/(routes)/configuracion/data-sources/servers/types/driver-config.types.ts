// Parámetros Comunes
export type CommonDriverConfig = {
  heartbeatInterval: number;
  retryPolicy: {
    maxRetries: number;
    backoffMultiplier: number;
    maxReconnectTime: number;
  };
  connectTimeout?: number;
  storeAndForward?: {
    enabled: boolean;
    preserveTimestamps: boolean;
  };
  lastError?: string;
  lastSeen?: string;
};

// ============= OPC UA =============
export enum SecurityPolicy {
  NONE = "None",
  BASIC128RSA15 = "Basic128Rsa15",
  BASIC256 = "Basic256",
  BASIC256SHA256 = "Basic256Sha256",
}

export enum SecurityMode {
  SIGN = "Sign",
  SIGN_AND_ENCRYPT = "Sign & Encrypt",
}

export enum LoginMode {
  ANONYMOUS = "Anonymous",
  USERNAME = "Username",
  CERTIFICATE = "Certificate",
}

export type OPCUAConfig = CommonDriverConfig & {
  serverUrl: string;
  securityPolicy: SecurityPolicy;
  securityMode: SecurityMode;
  loginMode: LoginMode;
  loginName?: string;
  password?: string;
  localCertificate?: string;
  localPrivateKey?: string;
};

// ============= Modbus TCP =============
export enum ModbusProtocol {
  TCP = "TCP/IP",
  UDP = "UDP",
}

export enum DataEncoding {
  ABCD = "ABCD (Big Endian)",
  DCBA = "DCBA (Little Endian)",
  BADC = "BADC (Byte Swap)",
  CDAB = "CDAB (Word Swap)",
}

export type ModbusTCPConfig = CommonDriverConfig & {
  serverIp: string;
  port: number;
  protocol: ModbusProtocol;
  unitId: number;
  connectTimeoutSec?: number;
  requestTimeoutMs?: number;
  dataEncoding: DataEncoding;
};

// ============= MQTT =============
export enum TLSMode {
  ACTIVATE = "Activate",
  DEACTIVATE = "Deactivate",
}

export type MQTTConfig = CommonDriverConfig & {
  serverUrl: string;
  port: number;
  tls: TLSMode;
  userName?: string;
  password?: string;
  clientId: string;
  keepAlive: number;
};

// ============= OPC DA =============
export type OPCDAConfig = CommonDriverConfig & {
  serverName: string;
  serverHost: string;
  dcomUser?: string;
  dcomPassword?: string;
  updateRate: number;
  groupDeadband?: number;
};

// ============= Data Base SQL =============
export enum DBType {
  POSTGRESQL = "PostgreSQL",
  MYSQL = "MySQL/MariaDB",
  SQLSERVER = "SQL Server",
}

export enum TimestampSource {
  PAYLOAD = "Payload",
  SYSTEM_TIME = "System Time",
  RECEPTION_TIME = "Reception Time",
}

export type DataBaseSQLConfig = CommonDriverConfig & {
  dbType: DBType;
  serverHost: string;
  port: number;
  databaseName: string;
  username: string;
  password: string;
  query: string;
  pollingInterval: number;
  timestampColumn: string;
  valueColumns: string;
};

// ============= API REST =============
export enum HTTPMethod {
  GET = "GET",
  POST = "POST",
}

export enum AuthType {
  NONE = "None",
  API_KEY = "API Key",
  BEARER_TOKEN = "Bearer Token",
  OAUTH = "OAuth",
}

export type APIRESTConfig = CommonDriverConfig & {
  endpointUrl: string;
  httpMethod: HTTPMethod;
  authenticationType: AuthType;
  authenticationValue?: string;
  headers?: Record<string, string>;
  pollingInterval: number;
  payloadMapping: string;
  timestampSource: TimestampSource;
};

// ============= Import File =============
export enum FileType {
  CSV = "CSV",
  EXCEL = "Excel (XLS/XLSX)",
}

export enum QualityStatus {
  GOOD = "Good",
  UNCERTAIN = "Uncertain",
  MANUAL = "Manual",
  ESTIMATED = "Estimated",
}

export type ImportFileConfig = CommonDriverConfig & {
  fileType: FileType;
  delimiter?: string;
  headerRow: boolean;
  encoding?: string;
  timestampColumn: string;
  valueColumns: string;
  tagMapping: string;
  defaultQuality: QualityStatus;
};

// ============= Manual =============
export type ManualConfig = CommonDriverConfig & {
  enableManualInput: boolean;
  allowedUsersRoles: string[];
  defaultQualitySource: QualityStatus;
  defaultQualityStatus: QualityStatus;
  manualTypeAllowed?: string[];
  approvalRequired: boolean;
};

// Tipo union para todas las configuraciones
export type DriverConfig =
  | OPCUAConfig
  | ModbusTCPConfig
  | MQTTConfig
  | OPCDAConfig
  | DataBaseSQLConfig
  | APIRESTConfig
  | ImportFileConfig
  | ManualConfig
  | CommonDriverConfig;
