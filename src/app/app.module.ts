import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { AppComponent } from './app.component';
import { MqttModule, IMqttServiceOptions } from "ngx-mqtt";
import { HttpClientModule } from '@angular/common/http';
import { PageNotFoundComponent }   from './client/page-not-found/page-not-found.component';
import { AppRoutingModule }        from './app-routing.module';
import { ClientsModule }            from './client/clients.module';
import { FormsModule }    from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'; 
import { ToastrModule } from 'ngx-toastr';



export const MQTT_SERVICE_OPTIONS: IMqttServiceOptions = {
  hostname: 'tailor.cloudmqtt.com',
  port : 12030,
  username : 'xjfsxsff',
  password : "K9phhM6agNJP",
  path: 'mqtt/python/test'

}
  
@NgModule({
  declarations: [
    AppComponent,
    PageNotFoundComponent,

    
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    MqttModule.forRoot(MQTT_SERVICE_OPTIONS),
    BrowserAnimationsModule,
    FormsModule,
    ClientsModule,
    AppRoutingModule,
    ToastrModule.forRoot() 
  ],
  providers: [],
  bootstrap: [AppComponent]
  
})
export class AppModule {}

