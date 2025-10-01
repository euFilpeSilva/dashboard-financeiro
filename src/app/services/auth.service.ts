import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { 
  Auth, 
  User, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
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
  private auth: Auth;
  private currentUserSubject = new BehaviorSubject<UserProfile | null>(null);
  private loadingSubject = new BehaviorSubject<boolean>(true);

  public readonly currentUser$ = this.currentUserSubject.asObservable();
  public readonly loading$ = this.loadingSubject.asObservable();
  public readonly isAuthenticated$ = new BehaviorSubject<boolean>(false);

  constructor(private firebaseService: FirebaseService) {
    this.auth = this.firebaseService.auth;
    this.initAuthStateListener();
  }

  private initAuthStateListener(): void {
    onAuthStateChanged(this.auth, (user: User | null) => {
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
      } else {
        this.currentUserSubject.next(null);
        this.isAuthenticated$.next(false);
      }
      this.loadingSubject.next(false);
    });
  }

  // Login com email e senha
  async signInWithEmail(email: string, password: string): Promise<UserProfile> {
    try {
      const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
      return this.mapFirebaseUserToProfile(userCredential.user);
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  // Registro com email e senha
  async signUpWithEmail(email: string, password: string, displayName?: string): Promise<UserProfile> {
    try {
      const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
      
      // Atualizar perfil com nome de exibição
      if (displayName) {
        await updateProfile(userCredential.user, { displayName });
      }
      
      return this.mapFirebaseUserToProfile(userCredential.user);
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  // Login com Google
  async signInWithGoogle(): Promise<UserProfile> {
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(this.auth, provider);
      return this.mapFirebaseUserToProfile(userCredential.user);
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  // Logout
  async signOut(): Promise<void> {
    try {
      await signOut(this.auth);
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  // Reset de senha
  async resetPassword(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(this.auth, email);
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  // Atualizar perfil
  async updateUserProfile(updates: { displayName?: string; photoURL?: string }): Promise<void> {
    try {
      if (this.auth.currentUser) {
        await updateProfile(this.auth.currentUser, updates);
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
  private mapFirebaseUserToProfile(user: User): UserProfile {
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
    let message = 'Erro de autenticação';

    switch (error.code) {
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
      default:
        message = error.message || 'Erro desconhecido';
    }

    return new Error(message);
  }
}