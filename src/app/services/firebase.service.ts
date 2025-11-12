import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { environment } from '../../environments/environment';
import { LoggerService } from './logger.service';

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {

  constructor(
    public firestore: AngularFirestore,
    public auth: AngularFireAuth,
    public storage: AngularFireStorage,
    private logger: LoggerService
  ) {
    this.initializeServices();
  }

  private initializeServices(): void {
    this.logger.info('🔥 Firebase inicializado com sucesso');

    if (!environment.production && environment.enableDebug) {
      this.logger.debug('🔧 Modo de desenvolvimento - Debug habilitado');
    }
  }

  // Verificar se o Firebase está inicializado
  isInitialized(): boolean {
    return !!(this.firestore && this.auth && this.storage);
  }

  // Obter informações do projeto
  getProjectInfo() {
    return {
      projectId: environment.firebase.projectId,
      appId: environment.firebase.appId,
      isProduction: environment.production,
      version: environment.version
    };
  }
}