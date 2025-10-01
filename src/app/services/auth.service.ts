import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import firebase from 'firebase/compat/app';
import { FirebaseService } from './firebase.service';

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
  createdAt: Date;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<UserProfile | null>(null);
  private loadingSubject = new BehaviorSubject<boolean>(true);

  public readonly currentUser$ = this.currentUserSubject.asObservable();
  public readonly loading$ = this.loadingSubject.asObservable();
  public readonly isAuthenticated$ = new BehaviorSubject<boolean>(false);

  constructor(
    private afAuth: AngularFireAuth,
    private firebaseService: FirebaseService
  ) {
    this.initAuthStateListener();
  }

  private initAuthStateListener(): void {
    console.log('🔧 Inicializando listener de autenticação...');
    
    this.afAuth.authState.subscribe((user: firebase.User | null) => {
      console.log('🔧 Estado de autenticação mudou:', user ? user.email : 'Usuário deslogado');
      
      if (user) {
        const userProfile: UserProfile = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          emailVerified: user.emailVerified,
          createdAt: user.metadata.creationTime ? new Date(user.metadata.creationTime) : new Date()
        };
        this.currentUserSubject.next(userProfile);
        this.isAuthenticated$.next(true);
        console.log('✅ Usuário autenticado:', userProfile.email);
      } else {
        this.currentUserSubject.next(null);
        this.isAuthenticated$.next(false);
        console.log('❌ Usuário não autenticado');
      }
      this.loadingSubject.next(false);
    });
    
    // Verificar persistência imediata
    this.afAuth.onAuthStateChanged((user) => {
      console.log('🔧 onAuthStateChanged chamado:', user ? user.email : 'sem usuário');
    });
  }

  // Login com email e senha
  async signInWithEmail(email: string, password: string): Promise<UserProfile> {
    try {
      const userCredential = await this.afAuth.signInWithEmailAndPassword(email, password);
      if (userCredential.user) {
        return this.mapFirebaseUserToProfile(userCredential.user);
      }
      throw new Error('Falha na autenticação');
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  // Registro com email e senha
  async signUpWithEmail(email: string, password: string, displayName?: string): Promise<UserProfile> {
    try {
      const userCredential = await this.afAuth.createUserWithEmailAndPassword(email, password);
      
      // Atualizar perfil com nome de exibição
      if (displayName && userCredential.user) {
        await userCredential.user.updateProfile({ displayName });
      }
      
      if (userCredential.user) {
        return this.mapFirebaseUserToProfile(userCredential.user);
      }
      throw new Error('Falha no registro');
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  // Login com Google
  async signInWithGoogle(): Promise<UserProfile> {
    try {
      console.log('🔍 Iniciando login com Google...');
      console.log('🔧 Firebase config check:', {
        hasApiKey: !!firebase.apps.length,
        authDomain: firebase.apps[0]?.options ? (firebase.apps[0].options as any).authDomain : 'N/A'
      });

      const provider = new firebase.auth.GoogleAuthProvider();
      provider.addScope('email');
      provider.addScope('profile');
      
      // Configurar para reduzir problemas de CORS
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      
      console.log('🚀 Chamando signInWithPopup...');
      
      // Tentar popup primeiro, se falhar usar redirect
      let userCredential;
      try {
        userCredential = await this.afAuth.signInWithPopup(provider);
      } catch (popupError: any) {
        console.warn('⚠️ Popup falhou, tentando redirect...', popupError);
        if (popupError.code === 'auth/popup-blocked' || popupError.code === 'auth/popup-closed-by-user') {
          // Se popup for bloqueado, usar redirect
          await this.afAuth.signInWithRedirect(provider);
          return new Promise((resolve, reject) => {
            this.afAuth.getRedirectResult().then(result => {
              if (result.user) {
                resolve(this.mapFirebaseUserToProfile(result.user));
              } else {
                reject(new Error('Redirect não retornou usuário'));
              }
            }).catch(reject);
          });
        } else {
          throw popupError;
        }
      }
      
      console.log('✅ Login realizado com sucesso:', userCredential.user?.email);
      
      if (userCredential.user) {
        return this.mapFirebaseUserToProfile(userCredential.user);
      }
      throw new Error('Falha na autenticação Google');
    } catch (error: any) {
      console.error('❌ Erro detalhado no Google Auth:', {
        code: error.code,
        message: error.message,
        stack: error.stack
      });
      throw this.handleAuthError(error);
    }
  }

  // Logout
  async signOut(): Promise<void> {
    try {
      await this.afAuth.signOut();
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  // Reset de senha
  async resetPassword(email: string): Promise<void> {
    try {
      await this.afAuth.sendPasswordResetEmail(email);
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  // Atualizar perfil
  async updateUserProfile(updates: { displayName?: string; photoURL?: string }): Promise<void> {
    try {
      const user = await this.afAuth.currentUser;
      if (user) {
        await user.updateProfile(updates);
        // Força a atualização do observable
        this.initAuthStateListener();
      }
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  // Obter usuário atual
  getCurrentUser(): UserProfile | null {
    return this.currentUserSubject.value;
  }

  // Verificar se está autenticado
  isAuthenticated(): boolean {
    return this.isAuthenticated$.value;
  }

  // Mapear usuário Firebase para perfil customizado
  private mapFirebaseUserToProfile(user: firebase.User): UserProfile {
    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      emailVerified: user.emailVerified,
      createdAt: user.metadata.creationTime ? new Date(user.metadata.creationTime) : new Date()
    };
  }

  // Tratar erros de autenticação
  private handleAuthError(error: any): Error {
    console.error('🔧 Erro capturado:', error);
    let message = 'Erro de autenticação';

    switch (error.code) {
      case 'auth/configuration-not-found':
        message = 'Configuração do Firebase não encontrada. Verifique as credenciais.';
        break;
      case 'auth/invalid-api-key':
        message = 'Chave de API do Firebase inválida';
        break;
      case 'auth/unauthorized-domain':
        message = 'Domínio não autorizado. Adicione localhost:4200 nos domínios autorizados do Firebase';
        break;
      case 'auth/operation-not-allowed':
        message = 'Login com Google não habilitado. Ative o provedor no Firebase Console';
        break;
      case 'auth/user-not-found':
        message = 'Usuário não encontrado';
        break;
      case 'auth/wrong-password':
        message = 'Senha incorreta';
        break;
      case 'auth/email-already-in-use':
        message = 'Este email já está em uso';
        break;
      case 'auth/weak-password':
        message = 'A senha deve ter pelo menos 6 caracteres';
        break;
      case 'auth/invalid-email':
        message = 'Email inválido';
        break;
      case 'auth/user-disabled':
        message = 'Usuário desabilitado';
        break;
      case 'auth/too-many-requests':
        message = 'Muitas tentativas. Tente novamente mais tarde';
        break;
      case 'auth/network-request-failed':
        message = 'Erro de conexão. Verifique sua internet';
        break;
      case 'auth/popup-closed-by-user':
        message = 'Login cancelado pelo usuário';
        break;
      case 'auth/popup-blocked':
        message = 'Popup bloqueado pelo navegador. Permita popups para este site';
        break;
      default:
        message = error.message || 'Erro desconhecido';
        // Se contém informações sobre configuração
        if (error.message?.includes('CONFIGURATION_NOT_FOUND')) {
          message = 'Erro de configuração do Firebase. Verifique as credenciais no arquivo de configuração.';
        }
    }

    return new Error(message);
  }
}