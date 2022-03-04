

import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {AboutComponent} from "./about/about.component";
import {CreatePatientComponent} from "./create-patient/create-patient.component";
import {ViewPatientComponent} from "./view-patient/view-patient.component";
import {HomeComponent} from "./home/home.component";
import {LoginComponent} from "./login/login.component";

const routes: Routes = [
  {
    path: 'about',
    component: AboutComponent
  },
  {
    path: 'add-patient',
    component: CreatePatientComponent
  },
  {
    path: '',
    component: HomeComponent

  },
  {
    path: 'patients',
    component: ViewPatientComponent
  },
  {
    path: 'login',
    component: LoginComponent
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
