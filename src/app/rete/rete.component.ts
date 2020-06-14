import { Component, AfterViewInit, ViewChild, ElementRef } from "@angular/core";

import { NodeEditor, Engine } from "rete";
import ConnectionPlugin from "rete-connection-plugin";
import ContextMenuPlugin from "rete-context-menu-plugin";
import { NumComponent } from "./components/number-component";
import { AddComponent } from "./components/add-component";
import { MqttSubComponent } from "./components/mqttSub-component";
import { MqttPubComponent } from "./components/mqttPub-component";
import { MqttDatabaseComponent } from "./components/mqttDatabase-component";
import { MqttAddComponent } from "./components/mqttAdd-component";
import { MqttMultiplyComponent } from "./components/mqttMultiply-component";
import { LoadAccumulatorComponent } from "./components/loadAccumulator-component";
import { GeneratorAccumulatorComponent } from "./components/generatorAccumulator-component";
import { FuelCellComponent } from "./components/fuelCellSpec-component";
import { LogicComponent } from "./components/logic-component";
import { AngularRenderPlugin } from "rete-angular-render-plugin";
import { Router } from "@angular/router";
import { ClientService } from "../client/client.service";
import { Client } from "../client/client";
import { Input } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { PriceFromHttp } from "./components/priceFromHttp-component";
import { BatterySpecComponent } from './components/batterySpec-component';
import { ControlComponent } from './components/control-component';

// import { writeFileSync, readFileSync } from 'fs';

@Component({
  selector: "app-rete",
  templateUrl: "./rete.component.html",
  styleUrls: ["./rete.component.css"],
})
export class ReteComponent implements AfterViewInit {
  client$: Client;
  status: string = "not Saved";
  deployStatus: string = "not deployed";
  schema: any;
  @Input() childUrl:string;
  constructor(private router: Router, 
    private service: ClientService,
    private toastr : ToastrService) {}

  @ViewChild("nodeEditor", { static: true }) el: ElementRef;
  editor = null;

  clickEvent() {}

  async ngAfterViewInit() {
    // this.masterName.subscribe((tes) => console.log(tes) )
    var parts = this.router.url.split("/");
    var lastSegment = parts.pop() || parts.pop(); // handle potential trailing slash

    const container = this.el.nativeElement;

    const components = [
      // new NumComponent(),
      // new AddComponent(),
      // new GenerateNumComponent(),
      new MqttSubComponent(),
      new MqttPubComponent(),
      // new DummyDataComponent(),
      new MqttDatabaseComponent(),
      new MqttAddComponent(),
      new MqttMultiplyComponent(),
      new LoadAccumulatorComponent(),
      new GeneratorAccumulatorComponent(),
      //new TopicMergeComponent(),
      // new LogicComponent(),
      new FuelCellComponent(),
      new BatterySpecComponent(),
      new ControlComponent()
    ];

    const editor = new NodeEditor("demo@0.2.0", container);

    editor.use(ConnectionPlugin);
    editor.use(AngularRenderPlugin); //, { component: MyNodeComponent });
    editor.use(ContextMenuPlugin);

    const engine = new Engine("demo@0.2.0");

    components.map((c) => {
      editor.register(c);
      engine.register(c);
    });

    // this.getClient(lastSegment,editor,engine);

    this.service.getClient(lastSegment)
    .subscribe((client) => {
      this.client$ = client[0];
      try {

        if (client[0].data == "{}"){
        
        client[0].data='{"id":"demo@0.2.0","nodes":{}}'
      }
      
      var string2 = client[0].data
         editor
            .fromJSON(JSON.parse(string2))
              .then(()=>{editor.on("error", () => {
                container.log("err");
              });
              editor.on(
                [
                  "process",
                  "nodecreated",
                  "noderemoved",
                  "connectioncreated",
                  "connectionremoved",
                ],
                (async () => {
                  await engine.abort();
                  engine.process(editor.toJSON());
                  this.schema = editor.toJSON();
                  this.status = "not Saved";
                  console.log(this.schema)
                }) as any
              );
        
              editor.view.resize();
              editor.trigger("process");
              
              });
        
      } catch (error) {
        console.log(error);
      }

     
    });
  }

  save() {
    var data = this.schema;
    data = JSON.stringify(data)
    console.log(data)
    var parts = this.router.url.split("/");
    var lastSegment = parts.pop() || parts.pop(); // handle potential trailing slash
    this.service.updateClientData(data, lastSegment).subscribe(
      () => {
        this.status = "Saved";
      },
      () => {
        this.status = "Not Saved";
      }
    );
  }
  deploy() {
    var data = this.schema;
    var parts = this.router.url.split("/");
    console.log(data)
    this.service.sendData(data, this.childUrl).subscribe(
      () => {
        this.showSuccess('Schema deployed successfuly')
        this.deployStatus= "Deployed"
      },
      () => {
        this.showSuccess('Schema deployed successfuly')
        this.deployStatus= "Deployed"
      }
    );
    data = JSON.stringify(data)
    var parts = this.router.url.split("/");
    var lastSegment = parts.pop() || parts.pop(); // handle potential trailing slash
    this.service.updateClientData(data, lastSegment).subscribe(
      () => {
        this.status = "Saved";
      },
      () => {
        this.status = "Not Saved";
      }
    );
    


  }

  
  showSuccess(message : string){
    this.toastr.success(message, 'Success Info');
  }

  showError(message : string){
    this.toastr.error(message, 'Error Info')
  }
}
