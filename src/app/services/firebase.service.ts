import { Injectable } from '@angular/core';
import { initializeApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth, Auth, connectAuthEmulator } from 'firebase/auth';
import { getStorage, FirebaseStorage, connectStorageEmulator } from 'firebase/storage';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {
  private app: FirebaseApp;
  private _firestore!: Firestore;
  private _auth!: Auth;
  private _storage!: FirebaseStorage;

  constructor() {
    this.app = initializeApp(environment.firebase);
    this.initializeServices();
  }

  private initializeServices(): void {
    // Inicializar Firestore
    this._firestore = getFirestore(this.app);
    
    // Inicializar Authentication
    this._auth = getAuth(this.app);
    
    // Inicializar Storage
    this._storage = getStorage(this.app);

    // Conectar aos emuladores em desenvolvimento
    if (!environment.production && environment.enableDebug) {
      this.connectToEmulators();
    }
  }

  private connectToEmulators(): void {
    try {
      // Conectar ao emulador do Firestore (porta 8080)
      connectFirestoreEmulator(this._firestore, 'localhost', 8080);
      
      // Conectar ao emulador do Auth (porta 9099)
      connectAuthEmulator(this._auth, 'http://localhost:9099');
      
      // Conectar ao emulador do Storage (porta 9199)
      connectStorageEmulator(this._storage, 'localhost', 9199);
      
      console.log('🔧 Firebase emulators conectados');
    } catch (error) {
      console.warn('⚠️ Não foi possível conectar aos emuladores Firebase:', error);
    }
  }

  // Getters para os serviços
  get firestore(): Firestore {
    return this._firestore;
  }

  get auth(): Auth {
    return this._auth;
  }

  get storage(): FirebaseStorage {
    return this._storage;
  }

  // Método para verificar se o Firebase está inicializado
  isInitialized(): boolean {
    return !!(this.app && this._firestore && this._auth && this._storage);
  }

  // Método para obter informações do projeto
  getProjectInfo() {
    return {
      projectId: this.app.options.projectId,
      appId: this.app.options.appId,
      isProduction: environment.production,
      version: environment.version
    };
  }
}