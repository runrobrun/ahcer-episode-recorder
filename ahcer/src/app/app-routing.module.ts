import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {AboutComponent} from "./about/about.component";
import {CreatePatientComponent} from "./create-patient/create-patient.component";
import {ViewPatientComponent} from "./view-patient/view-patient.component";
import {HomeComponent} from "./home/home.component";
import {ViewProfileComponent} from "./view-profile/view-profile.component";
import {LoginComponent} from "./login/login.component";
import {CreateEpisodeComponent} from "./create-episode/create-episode.component";
import {ViewEpisodesComponent} from "./view-episodes/view-episodes.component";
import { AngularFireAuthGuard } from '@angular/fire/compat/auth-guard';
import {AppComponent} from "./app.component";
import {redirectUnauthorizedTo} from "@angular/fire/auth-guard";
import { canActivate } from '@angular/fire/compat/auth-guard';



const redirectUnauthorizedToLogin = () => redirectUnauthorizedTo(['login']);


const routes: Routes = [

  { path: '',
    component: AppComponent,
    ...canActivate(redirectUnauthorizedToLogin)
  },
  {
    path: 'patients',
    component: ViewPatientComponent,
    ...canActivate(redirectUnauthorizedToLogin)

  },
  {
    path: 'add-patient',
    component: CreatePatientComponent,
    ...canActivate(redirectUnauthorizedToLogin)

  },
  {
    path: 'about',
    component: AboutComponent
  },
  {
    path: 'add-patient',
    component: CreatePatientComponent,
    ...canActivate(redirectUnauthorizedToLogin)

  },
  {
    path: 'view-profile/:userId',
    component: ViewProfileComponent,
    ...canActivate(redirectUnauthorizedToLogin)
  },
  {
    path: '',
    component: HomeComponent

  },
  {
    path: 'patients',
    component: ViewPatientComponent,
    ...canActivate(redirectUnauthorizedToLogin)
  },
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: 'record-episode',
    component: CreateEpisodeComponent,
    ...canActivate(redirectUnauthorizedToLogin)
  },
  {
    path: 'episodes',
    component: ViewEpisodesComponent,
    ...canActivate(redirectUnauthorizedToLogin)
  },

];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
