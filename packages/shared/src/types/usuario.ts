export type TipoUsuario = 'OPERADOR' | 'GESTOR' | 'DIRETOR' | 'ADMIN';

export interface Usuario {
  id: number;
  uuid: string;
  nome: string;
  email: string;
  telefone?: string;
  tipo: TipoUsuario;
  avatar_url?: string;
  ativo: boolean;
  ultimo_login?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface UsuarioCreate {
  nome: string;
  email: string;
  telefone?: string;
  senha: string;
  tipo: TipoUsuario;
  avatar_url?: string;
}

export interface UsuarioUpdate {
  nome?: string;
  telefone?: string;
  avatar_url?: string;
}

export interface UsuarioLogin {
  email: string;
  senha: string;
}

export interface UsuarioAuth {
  usuario: Omit<Usuario, 'senha_hash'>;
  token: string;
  expires_in: string;
}
