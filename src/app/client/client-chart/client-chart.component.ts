import { Component, OnInit, OnDestroy } from "@angular/core";
import { Chart } from "chart.js";
import { Subscription } from "rxjs/internal/Subscription";
import { Apollo } from "apollo-angular";
import gql from "graphql-tag";
import { Client, RootObject} from "../client";
import { Router } from "@angular/router";
import { InMemoryCache } from "apollo-cache-inmemory";
import { HttpLink } from "apollo-angular-link-http";
import { HttpClient } from "@angular/common/http";
import { WebSocketLink } from "apollo-link-ws";
import { setContext } from "apollo-link-context";
import { split, Observable } from "apollo-link";
import { getMainDefinition } from "apollo-utilities";
import { Title } from "@angular/platform-browser";
import { ClientService } from "../client.service";
import * as mqttt from "mqtt";


// Subscription
const pvSubscription = gql`
subscription pv{
	pv(limit: 100,order_by:{input_time:desc}){
      voltage
      current
      power
      energy
    	input_time
  }
}
`;
const dconSubscription = gql`
subscription dcon{
	dcon(limit: 100,order_by:{input_time:desc}){
      voltage
      current
      power
      energy
    	input_time
  }
}
`;
const inverterSubscription = gql`
subscription inverter{
	inverter(limit: 100,order_by:{input_time:desc}){
      voltage
      current
      power
      energy
    	input_time
  }
}
`;
const stateSubscription = gql`
subscription state{
	state(limit: 100,order_by:{input_time:desc}){
      cb_pv
      cb_pln
      cb_fc
      cb_dc_load
      cb_ac_load
      input_time
  }
}
`;
const pyranometerSubscription = gql`
subscription pyranometer{
	pyranometer(limit: 100,order_by:{input_time:desc}){
      pyranometer
      input_time
  }
}
`;

const pvEnergy = gql`
subscription pvenergy {
  last_1_day_temp(order_by: {one_min: desc}) {
    pvgenergy
    input_time : one_min
  }
}`
;

@Component({
  selector: "app-client-chart",
  templateUrl: "./client-chart.component.html",
  styleUrls: ["./client-chart.component.css"],
})
export class ClientChartComponent implements OnInit, OnDestroy {
  todoSubscription: Subscription;

  respond : RootObject;
  // PV
  titlePV;
  dataPV;
  chartPVPower;
  chartPVEnergy;
  chartPVVoltage;
  chartPVCurrent;

  // DCON
  titleDcon;
  dataDcon;
  chartDconPower;
  chartDconEnergy;
  chartDconVoltage;
  chartDconCurrent;

  //Inverter
  titleInverter;
  dataInverter;
  chartInverterPower;
  chartInverterEnergy;
  chartInverterVoltage;
  chartInverterCurrent;

  //STATE
  titleState;
  dataState;

  //Pyranommeter
  titlePyranometer;
  dataPyranometer;
  chartPyranometer;
  

  lastsegment;
  client$: Client;
  client;
  voltage;
  current;
  energy;
  power;
  input_time;
  chartPyranometerPower: any;
  


  constructor(
    private apollo: Apollo,
    private router: Router,
    private httpClient: HttpClient,
    private service: ClientService,
    private titleService: Title,){
       
   
    }
  //   // private _mqttService: MqttService
  // ) { _mqttService.connect({username: 'xjfsxsff', password: 'K9phhM6agNJP'});}

  ngOnInit() {
    var parts = this.router.url.split("/");
    this.lastsegment = parts.pop() || parts.pop(); // handle potential trailing slash
    this.getClient(this.lastsegment);   
    this.mqttConnect(); 
  
  }
  ngAfterViewInit(){
      //chart PV
      this.chartPVCurrent = new Chart('chartPVCurrent', {
        type: 'line',
        data: {
          datasets: [
            {   
            
              borderColor: "#3cba9f",
              fill: true
            },
            { 
            
              borderColor: "#3cba",
              fill: true
            }
          ]
        },
        options: {
          legend: {
            display: false
          },
          scales: {
            xAxes: [{
              type: 'time',
              scaleLabel: {
                display: true,
                labelString: 'Time'
              }
            }],
            yAxes: [{
              
              scaleLabel: {
                display: true,
                labelString: 'Current'
              }
            }],
          }
        }
      });
  
      this.chartPVVoltage = new Chart('chartPVVoltage', {
        type: 'line',
        data: {
          datasets: [
            {   
            
              borderColor: "#3cba9f",
              fill: true
            },
            { 
            
              borderColor: "#3cba",
              fill: true
            }
          ]
        },
        options: {
          legend: {
            display: false
          },
          scales: {
            xAxes: [{
              type: 'time',
              scaleLabel: {
                display: true,
                labelString: 'Time'
              }
            }],
            yAxes: [{
              scaleLabel: {
                display: true,
                labelString: 'Voltage'
              }
            }],
          }
        }
      });
  
      this.chartPVEnergy= new Chart('chartPVEnergy', {
        type: 'line',
        data: {
          datasets: [
            {   
            
              borderColor: "#3cba9f",
              fill: true
            },
            { 
            
              borderColor: "#3cba",
              fill: true
            }
          ]
        },
        options: {
          legend: {
            display: false
          },
          scales: {
            xAxes: [{
              type: 'time',
              scaleLabel: {
                display: true,
                labelString: 'Time'
              }
            }],
            yAxes: [{
              scaleLabel: {
                display: true,
                labelString: 'Energy'
              }
            }],
          }
        }
      });
  
      this.chartPVPower= new Chart('chartPVPower', {
        type: 'line',
        data: {
          datasets: [
            {   
            
              borderColor: "#3cba9f",
              fill: true
            },
            { 
            
              borderColor: "#3cba",
              fill: true
            }
          ]
        },
        options: {
          legend: {
            display: false
          },
          scales: {
            xAxes: [{
              type: 'time',
              scaleLabel: {
             
             
                display: true,
                labelString: 'Time'
              }
            }],
            yAxes: [{
              scaleLabel: {
                display: true,
                labelString: 'Power'
              }
            }],
          }
        }
      });
  
      //chart Dcon
      this.chartDconCurrent = new Chart('chartDconCurrent', {
        type: 'line',
        data: {
          datasets: [
            {   
            
              borderColor: "#3cba9f",
              fill: true
            },
            { 
            
              borderColor: "#3cba",
              fill: true
            }
          ]
        },
        options: {
          legend: {
            display: false
          },
          scales: {
            xAxes: [{
              type: 'time',
              scaleLabel: {
             
                display: true,
                labelString: 'Time'
              }
            }],
            yAxes: [{
              scaleLabel: {
                display: true,
                labelString: 'Current'
              }
            }],
          }
        }
      });
  
      this.chartDconVoltage = new Chart('chartDconVoltage', {
        type: 'line',
        data: {
          datasets: [
            {   
            
              borderColor: "#3cba9f",
              fill: true
            },
            { 
            
              borderColor: "#3cba",
              fill: true
            }
          ]
        },
        options: {
          legend: {
            display: false
          },
          scales: {
            xAxes: [{
              type: 'time',
              scaleLabel: {
             
                display: true,
                labelString: 'Time'
              }
            }],
            yAxes: [{
              scaleLabel: {
                display: true,
                labelString: 'Voltage'
              }
            }],
          }
        }
      });
  
      this.chartDconEnergy= new Chart('chartDconEnergy', {
        type: 'line',
        data: {
          datasets: [
            {   
            
              borderColor: "#3cba9f",
              fill: true
            },
            { 
            
              borderColor: "#3cba",
              fill: true
            }
          ]
        },
        options: {
          legend: {
            display: false
          },
          scales: {
            xAxes: [{
              type: 'time',
              scaleLabel: {
             
                display: true,
                labelString: 'Time'
              }
            }],
            yAxes: [{
              scaleLabel: {
                display: true,
                labelString: 'Energy'
              }
            }],
          }
        }
      });
  
      this.chartDconPower= new Chart('chartDconPower', {
        type: 'line',
        data: {
          datasets: [
            {   
            
              borderColor: "#3cba9f",
              fill: true
            },
            { 
            
              borderColor: "#3cba",
              fill: true
            }
          ]
        },
        options: {
          legend: {
            display: false
          },
          scales: {
            xAxes: [{
              type: 'time',
              scaleLabel: {
             
                display: true,
                labelString: 'Time'
              }
            }],
            yAxes: [{
              scaleLabel: {
                display: true,
                labelString: 'Power'
              }
            }],
          }
        }
      });
  
      //chart Inverter
      this.chartInverterCurrent = new Chart('chartInverterCurrent', {
        type: 'line',
        data: {
          datasets: [
            {   
            
              borderColor: "#3cba9f",
              fill: true
            },
            { 
            
              borderColor: "#3cba",
              fill: true
            }
          ]
        },
        options: {
          legend: {
            display: false
          },
          scales: {
            xAxes: [{
              type: 'time',
              scaleLabel: {
             
                display: true,
                labelString: 'Time'
              }
            }],
            yAxes: [{
              scaleLabel: {
                display: true,
                labelString: 'Current'
              }
            }],
          }
        }
      });
  
      this.chartInverterVoltage = new Chart('chartInverterVoltage', {
        type: 'line',
        data: {
          datasets: [
            {   
            
              borderColor: "#3cba9f",
              fill: true
            },
            { 
            
              borderColor: "#3cba",
              fill: true
            }
          ]
        },
        options: {
          legend: {
            display: false
          },
          scales: {
            xAxes: [{
              type: 'time',
              scaleLabel: {
             
                display: true,
                labelString: 'Time'
              }
            }],
            yAxes: [{
              scaleLabel: {
                display: true,
                labelString: 'Voltage'
              }
            }],
          }
        }
      });
  
      this.chartInverterEnergy= new Chart('chartInverterEnergy', {
        type: 'line',
        data: {
          datasets: [
            {   
            
              borderColor: "#3cba9f",
              fill: true
            },
            { 
            
              borderColor: "#3cba",
              fill: true
            }
          ]
        },
        options: {
          legend: {
            display: false
          },
          scales: {
            xAxes: [{
              type: 'time',
              scaleLabel: {
             
                display: true,
                labelString: 'Time'
              }
            }],
            yAxes: [{
              scaleLabel: {
                display: true,
                labelString: 'Energy'
              }
            }],
          }
        }
      });
  
      this.chartInverterPower= new Chart('chartInverterPower', {
        type: 'line',
        data: {
          datasets: [
            {   
            
              borderColor: "#3cba9f",
              fill: true
            },
            { 
            
              borderColor: "#3cba",
              fill: true
            }
          ]
        },
        options: {
          legend: {
            display: false
          },
          scales: {
            xAxes: [{
              type: 'time',
              scaleLabel: {
             
                display: true,
                labelString: 'Time'
              }
            }],
            yAxes: [{
              scaleLabel: {
                display: true,
                labelString: 'Power'
              }
            }],
          }
        }
      });
  
      //chart Pyranometer
      this.chartPyranometer= new Chart('chartPyranometer', {
        type: 'line',
        data: {
          datasets: [
            {   
            
              borderColor: "#3cba9f",
              fill: true
            },
            { 
            
              borderColor: "#3cba",
              fill: true
            }
          ]
        },
        options: {
          legend: {
            display: false
          },
          scales: {
            xAxes: [{
              type: 'time',
              scaleLabel: {
             
                display: true,
                labelString: 'Irradiance'
              }
            }],
            yAxes: [{
              scaleLabel: {
                display: true,
                labelString: 'Time'
              }
            }],
          }
        }
      });
    }
  

  ngOnDestroy() {
    this.apollo.removeClient();
  }
  getQueryResult(_query, _dataToPlace, _title) {
    this.apollo
      .watchQuery({
        query: _query,
      })
      .valueChanges.subscribe(({ data, loading }) => {
        _dataToPlace = data;
        var key1 = Object.keys(data);
        _title = Object.keys(data[key1.toString()][0]);
      });
  }

  getClient(id: any) {
    this.service.getClient(id).subscribe(
      (client) => {
        this.client$ = client[0];
        const httpLink = new HttpLink(this.httpClient).create({
          uri: "http://"+this.client$.streamData,
        });

        const subscriptionLink = new WebSocketLink({
          uri: "ws://"+this.client$.streamData,

          options: {
            reconnect: true,
            connectionParams: {
              // headers: {
              //   "x-hasura-admin-secret": "mylongsecretkey",
              // },
            },
          },
        });

        const auth = setContext((operation, context) => ({
          // headers: {
          //   "x-hasura-admin-secret": "mylongsecretkey",
          // },
        }));

        const link = split(
          ({ query }) => {
            let definition = getMainDefinition(query);
            return (
              definition.kind === "OperationDefinition" &&
              definition.operation === "subscription"
            );
          },
          subscriptionLink,
          auth.concat(httpLink)
        );
        this.apollo.create({
          link,
          cache: new InMemoryCache(),
        });

        //PV
        this.apollo
        .subscribe({
          query: pvSubscription
        })
        .subscribe((data : RootObject) => {   
          this.dataPV =data.data.pv
          this.power = this.dataPV.map(node => node.power)
          this.current = this.dataPV.map(node => node.current)
          this.energy = this.dataPV.map(node => node.energy)
          this.voltage = this.dataPV.map(node => node.voltage)
          this.input_time = this.dataPV.map(node => node.input_time)
          this.titlePV = Object.keys(this.dataPV[0]);
          this.titlePV.pop("__typename");
          this.titlePV= this.captilize(this.titlePV)

          this.power = this.dataPV.map(node => node.power)
          this.current = this.dataPV.map(node => node.current)
          this.energy = this.dataPV.map(node => node.energy)
          this.voltage = this.dataPV.map(node => node.voltage)
          this.input_time = this.dataPV.map(node => node.input_time)
          this.updateChartData(this.chartPVCurrent,this.current, this.input_time)
          this.updateChartData(this.chartPVVoltage,this.voltage, this.input_time)
          this.updateChartData(this.chartPVEnergy,this.energy, this.input_time)
          this.updateChartData(this.chartPVPower,this.power, this.input_time)
          
          });
        //DCON
        this.apollo
        .subscribe({
          query: dconSubscription
        })
        .subscribe((data : RootObject) => {   
          this.dataDcon =data.data.dcon
          this.titleDcon = Object.keys(this.dataDcon[0]);
          this.titleDcon.pop("__typename");
          this.titleDcon= this.captilize(this.titleDcon)
          this.power = this.dataDcon.map(node => node.power)
          this.current = this.dataDcon.map(node => node.current)
          this.energy = this.dataDcon.map(node => node.energy)
          this.voltage = this.dataDcon.map(node => node.voltage)
          this.input_time = this.dataDcon.map(node => node.input_time)
          this.updateChartData(this.chartDconCurrent,this.current, this.input_time)
          this.updateChartData(this.chartDconVoltage,this.voltage, this.input_time)
          this.updateChartData(this.chartDconEnergy,this.energy, this.input_time)
          this.updateChartData(this.chartDconPower,this.power, this.input_time)
          });

        //INVERTER
        this.apollo
        .subscribe({
          query: inverterSubscription
        })
        .subscribe((data : RootObject) => {   
          this.dataInverter =data.data.inverter
          this.titleInverter = Object.keys(this.dataInverter[0]);
          this.titleInverter.pop("__typename");
          this.titleInverter= this.captilize(this.titleInverter)

          this.power = this.dataInverter.map(node => node.power)
          this.current = this.dataInverter.map(node => node.current)
          this.energy = this.dataInverter.map(node => node.energy)
          this.voltage = this.dataInverter.map(node => node.voltage)
          this.input_time = this.dataInverter.map(node => node.input_time)
          this.updateChartData(this.chartInverterCurrent,this.current, this.input_time)
          this.updateChartData(this.chartInverterVoltage,this.voltage, this.input_time)
          this.updateChartData(this.chartInverterEnergy,this.energy, this.input_time)
          this.updateChartData(this.chartInverterPower,this.power, this.input_time)
          });

        //State
        this.apollo
        .subscribe({
          query: stateSubscription
        })
        .subscribe((data : RootObject) => {   
          this.dataState =data.data.state
          this.titleState = Object.keys(this.dataState[0]);
          this.titleState.pop("__typename");
          this.titleState= this.captilize(this.titleState)
          });
        ///Pyranometer
        this.apollo
        .subscribe({
          query: pyranometerSubscription
        })
        .subscribe((data : RootObject) => {   
          this.dataPyranometer =data.data.pyranometer
          this.titlePyranometer = Object.keys(this.dataPyranometer[0]);
          this.titlePyranometer.pop("__typename");
          this.titlePyranometer= this.captilize(this.titlePyranometer)
          this.irradiance = this.dataPyranometer.map(node => node.pyranometer)
          this.input_time = this.dataPyranometer.map(node => node.input_time)
          this.updateChartData(this.chartPyranometer,this.irradiance, this.input_time)
          });
      //     ///Queru bucket
      //   this.apollo
      //   .subscribe({
      //     query: pyranometerSubscription
      //   })
      //   .subscribe((data : RootObject) => {   
      //     // this.dataPyranometer =data.data.pyranometer
      //     // this.titlePyranometer = Object.keys(this.dataPyranometer[0]);
      //     // this.titlePyranometer.pop("__typename");
      //     // this.titlePyranometer= this.captilize(this.titlePyranometer)
      //     // this.irradiance = this.dataPyranometer.map(node => node.pyranometer)
      //     // this.input_time = this.dataPyranometer.map(node => node.input_time)
      //     // this.updateChartData(this.chartPyranometer,this.irradiance, this.input_time)
      //     });
      // },
      },
      (error) => console.log("HAI")
    );
  
    }
  irradiance(chartPyranometer: any, irradiance: any, input_time: any) {
    throw new Error("Method not implemented.");
  }

    sendmsg(){
      // this.client.on('connect', function () {
        this.client.publish('/gilang123/presence123', 'Hello mqtt',{qos:2},function (err){
          if(!err){
            console.log("good")
          }
        })
    }

    mqttConnect(){
      this.client =  mqttt.connect({
        host: 'tailor.cloudmqtt.com',
        port: '32030' ,
        username: 'xjfsxsff',
        password: 'K9phhM6agNJP',
        protocol:'wss'
        
    })
    }

    getFormattedDate(date : string){
      let current_datetime = new Date(date)
      let formatted_date = current_datetime.getFullYear() + "-" + (current_datetime.getMonth() + 1) + "-" + current_datetime.getDate() + " " + current_datetime.getHours() + ":" + current_datetime.getMinutes() + ":" + current_datetime.getSeconds() 
      return formatted_date
    }

     captilize(arr){
      let result=[]
      for(let i in arr){
      result.push(arr[i].charAt(0).toUpperCase() + arr[i].slice(1))
      }
      return result}

    updateChartData(chart, _data1,_label){  
      chart.data.labels = _label.reverse();
      chart.data.datasets[0].data = _data1.reverse();
      // chart.data.datasets[1].data = _data2;
      chart.update();
    }


}
