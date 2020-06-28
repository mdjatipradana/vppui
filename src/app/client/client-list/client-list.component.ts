import { Component, OnInit } from '@angular/core';
import { Chart } from 'chart.js';
import { ClientService }  from '../client.service';
import { Client, RootObject, Nodes, User } from '../client';
import { ToastrService } from 'ngx-toastr'
import { Router } from '@angular/router';
import gql from 'graphql-tag';
import { HttpLink } from 'apollo-angular-link-http';
import { Apollo } from 'apollo-angular';
import { HttpClient } from '@angular/common/http';
import { WebSocketLink } from 'apollo-link-ws';
import { split } from 'apollo-link';
import { getMainDefinition } from "apollo-utilities";
import { setContext } from 'apollo-link-context';
import { InMemoryCache } from 'apollo-cache-inmemory';
import { TokenStorageService } from 'src/app/_services/token-storage.service';
import { connectableObservableDescriptor } from 'rxjs/internal/observable/ConnectableObservable';

const loadpoweraggregate = gql`
subscription loadpoweraggregate{
  loadpoweraggregate(limit:1,order_by:{time:desc})
    {
    load
    },
}
`;
const totalexchange = gql`
subscription totalexchange{
  totalexchange(limit:1,order_by:{time:desc})
    {
    power
    },
}
`;

const genpoweraggregate = gql`
subscription genpoweraggregate{
  genpoweraggregate(limit:1,order_by:{time:desc})
    {
    power,time
    },
}
`;

const graphgen = gql`
query a ($time_1: timestamp!, $time_2: timestamp!){
  sumallpv: one_hourpv(where: 
    {_and: [
      {bucket: {_gte: $time_1}}
      {bucket: {_lte: $time_2}}
   ]
     
   }) {
     power
     time: bucket
   },
   sumallfc: one_hourfc(where: 
    {_and: [
      {bucket: {_gte: $time_1}}
      {bucket: {_lte: $time_2}}
   ]
     
   }) {
     power
     time: bucket
   },
   sumallbat: one_hourbat(where: 
    {_and: [
      {bucket: {_gte: $time_1}}
      {bucket: {_lte: $time_2}}
   ]
     
   }) {
     power
     time: bucket
   },
  loadpoweraggregate: one_hour2(where: 
    {_and: [
      {bucket: {_gte: $time_1}}
      {bucket: {_lte: $time_2}}
   ]
     
   }) {
     load
     time: bucket
   }
 }
`;

const graphpv = gql`
query a ($time_1: timestamp!, $time_2: timestamp!){
  sumallpv: one_hourpv(where: 
   {_and: [
     {bucket: {_gte: $time_1}}
     {bucket: {_lte: $time_2}}
  ]
    
  }) {
    power
    time: bucket
  }
 }
`;
const graphfc = gql`
query a ($time_1: timestamp!, $time_2: timestamp!){
  sumallfc: one_hourfc(where: 
   {_and: [
     {bucket: {_gte: $time_1}}
     {bucket: {_lte: $time_2}}
  ]
    
  }) {
    power
    time: bucket
  }
 }
`;

const graphbat  = gql`
query a ($time_1: timestamp!, $time_2: timestamp!){
  sumallbat: one_hourbat(where: 
   {_and: [
     {bucket: {_gte: $time_1}}
     {bucket: {_lte: $time_2}}
  ]
    
  }) {
    power
    time: bucket
  }
 }
`;


@Component({
  selector: 'app-client-list',
  templateUrl: './client-list.component.html',
  styleUrls: ['./client-list.component.css']
})
export class ClientListComponent implements OnInit {
  clients : Client[]
  client: Client
  Users : User[]
  selectedId : any
  newClient : Client[]
  chart: any
  chartPv : any
  chartFc : any
  chartBat : any
  ids: any[]
  usernames: any[]
  loadpoweraggregate
  genpoweraggregate
  exchangeData

  result
  result2
  resultfc
  resultbat
  resultpv
  power
  inputTime

  isAdmin = false
  time: any;

  nameIsNull
  locationIsNull 
  urlIsNull
  dataIsNull
  streamDataIsNull 
  useridIsNull
 
 


  constructor(
    private service: ClientService,
    private toastr: ToastrService,
    private router: Router,
    private apollo: Apollo,
    private httpClient: HttpClient,
    private user : TokenStorageService
  ) {}

  ngOnInit() {

    if(this.user.getUser() != null){
      if(this.user.getUser().roles == "admin" )
        this.isAdmin = true
    }
    this.apollo.removeClient()
    this.getClients();
    this.getAllUser();
    this.getExchangeData()
    this.getDateFromOption("","")

    // chart Gen
      this.chart = new Chart('line', {
      type: 'line',
      data: {
        datasets: [
          {   
            label: 'Power',
            backgroundColor: "rgba(54, 162, 235, 0.5)",
            borderColor: 'rgba(54, 162, 235, 1)',
            fill: true,
            pointRadius: 1,
            borderWidth : 1
          },
          { 
            label: 'Load',
            backgroundColor: "rgba(255, 0, 0, 0.5)",
            borderColor: 'rgba(255, 0, 0, 1)',
            fill: true,
            pointRadius: 1,
            borderWidth : 0.1
          }
        ]
      },
      options: {
        legend: {
          display: true
        },
        scales: {
          xAxes: [{
            scaleLabel: {
              display: true,
              labelString: 'Time in Hour'
            },
            type: 'time',
            time: {
                displayFormats: {
                    hout: 'hA'
                }
            }
          },
        
        ],
          yAxes: [{
            scaleLabel: {
              display: true,
              labelString: 'Power (Watt)'
            }
          }]
        }}
    });

    // Chart PV
    this.chartPv = new Chart('linepv', {
      type: 'line',
      data: {
        datasets: [
          {   
            label: 'Power',
            backgroundColor: "rgba(54, 162, 235, 0.5)",
            borderColor: 'rgba(54, 162, 235, 1)',
            fill: true,
            pointRadius: 1,
            borderWidth : 1
          }
        ]
      },
      options: {
        legend: {
          display: true
        },
        scales: {
          xAxes: [{
            scaleLabel: {
              display: true,
              labelString: 'Time in Hour'
            },
            type: 'time',
            time: {
                displayFormats: {
                    hout: 'hA'
                }
            }
          },
        
        ],
          yAxes: [{
            scaleLabel: {
              display: true,
              labelString: 'Power (Watt)'
            }
          }]
        }}
    });

     // Chart FC
     this.chartFc = new Chart('linefc', {
      type: 'line',
      data: {
        datasets: [
          {   
            label: 'Power',
            backgroundColor: "rgba(54, 162, 235, 0.5)",
            borderColor: 'rgba(54, 162, 235, 1)',
            fill: true,
            pointRadius: 1,
            borderWidth : 1
          }
        ]
      },
      options: {
        legend: {
          display: true
        },
        scales: {
          xAxes: [{
            scaleLabel: {
              display: true,
              labelString: 'Time in Hour'
            },
            type: 'time',
            time: {
                displayFormats: {
                    hout: 'hA'
                }
            }
          },
        
        ],
          yAxes: [{
            scaleLabel: {
              display: true,
              labelString: 'Power (Watt)'
            }
          }]
        }}
    });

     // Chart BAt
     this.chartBat = new Chart('linebat', {
      type: 'line',
      data: {
        datasets: [
          {   
            label: 'Power',
            backgroundColor: "rgba(54, 162, 235, 0.5)",
            borderColor: 'rgba(54, 162, 235, 1)',
            fill: true,
            pointRadius: 1,
            borderWidth : 1
          }
        ]
      },
      options: {
        legend: {
          display: true
        },
        scales: {
          xAxes: [{
            scaleLabel: {
              display: true,
              labelString: 'Time in Hour'
            },
            type: 'time',
            time: {
                displayFormats: {
                    hout: 'hA'
                }
            }
          },
        
        ],
          yAxes: [{
            scaleLabel: {
              display: true,
              labelString: 'Power (Watt)'
            }
          }]
        }}
    });
 

  }


  getClients() {
    
    this.service.getClients()
      .subscribe(
        client => {
          this.clients = client;
        },
        error => this.router.navigateByUrl('/login'));
  }

  getAllUser() {
    
    this.service.getAvailUser()
      .subscribe(
        users => {
          this.Users = users;
          this.ids = this.Users.map(x => x.id)
          this.usernames = this.Users.map(x => x.username)
          console.log(this.usernames)

        },
        error => {})
  }

  addClient(name: string, location :string, url:string, streamData:string , userid:number): void {
   
    console.log("user id :"+userid)
    name = name.trim();
    location = location.trim();
    url = url.trim();
    streamData = streamData.trim();
    var data='{"id":"demo@0.2.0","nodes":{}}'

    if(!name){
      this.nameIsNull = true
    }
    if(!location){
      this.locationIsNull = true
    }
    if(!url){
      this.urlIsNull = true
    }
    if(!streamData){
      this.streamDataIsNull = true
    }
    if(!userid){
      this.useridIsNull = true
    }

    
    if (!name || !location || !url || !data || !streamData || !userid ) { return; }
    this.service.addClient({name,location,url,streamData, data, userid} as Client)
    .subscribe(client => {
      this.clients.push(client);
      this.showSuccess("Client added Succesfully")
    },

    error =>{
      this.showError()
    }
     
    );
  }


  showSuccess(message : string){
    this.toastr.success(message, 'Success Info');
  }

  showError(){
    this.toastr.error('Error!!', 'Error Info')
  }

  updateChartData(chart, _data1, _data2){  
    // chart.data.labels = _label;
    chart.data.datasets[0].data= _data1
    chart.data.datasets[1].data= _data2
    //chart.data.datasets[1].data = _data2;
    chart.update();
  }

  updateSingleDatachart(chart,_data1){
      // chart.data.labels = _label;
      chart.data.datasets[0].data= _data1
      //chart.data.datasets[1].data = _data2;
      chart.update();
  }


  getExchangeData(){
    // const for HTTP
    const httpLink = new HttpLink(this.httpClient).create({
      uri: "https://"+'hasuramainserver.herokuapp.com/v1/graphql',
    });

    // const for WebSocket
    const subscriptionLink = new WebSocketLink({
      uri: "wss://"+'hasuramainserver.herokuapp.com/v1/graphql',
      options: {
        reconnect: true,
        connectionParams: {
        },
      },
    });

    //Auth
    const auth = setContext((operation, context) => ({
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


  
  // genpower subscribe
  this.apollo
  .subscribe({
    query: genpoweraggregate
  })
  .subscribe((data : RootObject) => {   
    let result = data.data.genpoweraggregate[0].power;
    let time = data.data.genpoweraggregate[0].time;
    this.genpoweraggregate = parseFloat(result).toFixed(2);
    this.time  = time.replace(/z|t/gi,' ').slice(0, -7);;
    console.log(data.data.genpoweraggregate[0])
  })

  // load  subscribe
  this.apollo
  .subscribe({
    query: loadpoweraggregate
  })
  .subscribe((data : RootObject) => {   
    let result = data.data.loadpoweraggregate[0].load;
    this.loadpoweraggregate = parseFloat(result).toFixed(2);
  })

   // load  subscribe
   this.apollo
   .subscribe({
     query: totalexchange
   })
   .subscribe((data : RootObject) => {   
     let result = data.data.totalexchange[0].power;
     this.exchangeData = parseFloat(result).toFixed(2);
   })


}

setQueryGraphGen(_time_1 : string, _time_2:string){

  this.apollo
  .subscribe({
    query: graphgen,
    variables:{time_1:_time_2, time_2:_time_1} 
  })
  .subscribe((data: RootObject) => { 
   this.resultfc = data.data.sumallfc
   this.resultpv = data.data.sumallpv
   this.resultbat = data.data.sumallbat
   this.result2 = data.data.loadpoweraggregate
   this.result2 = this.renameKey2(this.result2)
   this.resultfc = this.renameKey(this.resultfc)
   this.resultpv = this.renameKey(this.resultpv)
   this.resultbat = this.renameKey(this.resultbat)
  //  this.power = this.result.map(x => x.power)
  //  this.inputTime = this.result.map(x =>x.time)
  //  console.log(this.result)
   console.log(this.resultpv)
   var Total = this.resultpv
   console.log(Total)
   console.log(this.resultbat.length)
   console.log(this.resultpv.length)
   console.log(this.resultfc.length)

for( var i = 0; i < this.resultpv.length; i++)
    {

      console.log(this.resultbat[i].y)
      console.log(this.resultpv[i].y)
      console.log(this.resultfc[i].y)
      console.log("=======================================")
        Total[i].y=(this.resultbat[i].y+this.resultfc[i].y+this.resultpv[i].y);
    }

    console.log(Total)
   this.updateChartData(this.chart,Total,this.result2)
  })
 
}

setQueryGraphPv(_time_1 : string, _time_2:string){

  this.apollo
  .subscribe({
    query: graphpv,
    variables:{time_1:_time_2, time_2:_time_1} 
  })
  .subscribe((data: RootObject) => { 
   this.result = data.data.sumallpv
   this.result = this.renameKey(this.result)
  //  console.log(this.result)
   this.updateSingleDatachart(this.chartPv,this.result)
  })
 
}

setQueryGraphFc(_time_1 : string, _time_2:string){

  this.apollo
  .subscribe({
    query: graphfc,
    variables:{time_1:_time_2, time_2:_time_1} 
  })
  .subscribe((data: RootObject) => { 
   this.result = data.data.sumallfc
   this.result = this.renameKey(this.result)
   this.updateSingleDatachart(this.chartFc,this.result)
  })
 
}

setQueryGraphBat(_time_1 : string, _time_2:string){

  this.apollo
  .subscribe({
    query: graphbat,
    variables:{time_1:_time_2, time_2:_time_1} 
  })
  .subscribe((data: RootObject) => { 
   this.result = data.data.sumallbat
   this.result = this.renameKey(this.result)
   this.updateSingleDatachart(this.chartBat,this.result)
  })
 
}

getDateForGraph(_date){
var date = _date
var dd = String(date.getDate()).padStart(2, '0');
var mm = String(date.getMonth() + 1).padStart(2, '0'); //January is 0!
var yyyy = date.getFullYear();
var dayminone = String(date.getDate()-1).padStart(2, '0');
return([(mm + '-' + dd + '-' + yyyy),(mm + '-' + dayminone + '-' + yyyy)]);
}

getDateFromOption(value : string, key : string){
  var date = new Date()
  // console.log(key)
  let result
  switch(value) {
    case "1":
        date.setDate(date.getDate()+1)
       result = this.getDateForGraph(date)
       if(key == 'gen'){
       this.setQueryGraphGen(result[0],result[1])}
       else if(key == 'fc'){
       this.setQueryGraphFc(result[0],result[1])}
       else if(key == 'pv'){
       this.setQueryGraphPv(result[0],result[1])}
       else if(key == 'bat'){
       this.setQueryGraphBat(result[0],result[1])}
      //  console.log(result)
       break;
    case "2":
       date.setDate(date.getDate())
       result = this.getDateForGraph(date)
       if(key == 'gen'){
        this.setQueryGraphGen(result[0],result[1])}
        else if(key == 'fc'){
        this.setQueryGraphFc(result[0],result[1])}
        else if(key == 'pv'){
        this.setQueryGraphPv(result[0],result[1])}
        else if(key == 'bat'){
        this.setQueryGraphBat(result[0],result[1])}
      //  console.log(result)
       break;
    case "3":
      date.setDate(date.getDate()-1)
      result = this.getDateForGraph(date)
      if(key == 'gen'){
        this.setQueryGraphGen(result[0],result[1])}
        else if(key == 'fc'){
        this.setQueryGraphFc(result[0],result[1])}
        else if(key == 'pv'){
        this.setQueryGraphPv(result[0],result[1])}
        else if(key == 'bat'){
        this.setQueryGraphBat(result[0],result[1])}
      break;
    case "4":
      date.setDate(date.getDate()-2)
      result = this.getDateForGraph(date)
      if(key == 'gen'){
        this.setQueryGraphGen(result[0],result[1])}
        else if(key == 'fc'){
        this.setQueryGraphFc(result[0],result[1])}
        else if(key == 'pv'){
        this.setQueryGraphPv(result[0],result[1])}
        else if(key == 'bat'){
        this.setQueryGraphBat(result[0],result[1])}
      break;
    case "5":
      date.setDate(date.getDate()-3)
      result = this.getDateForGraph(date)
      if(key == 'gen'){
        this.setQueryGraphGen(result[0],result[1])}
        else if(key == 'fc'){
        this.setQueryGraphFc(result[0],result[1])}
        else if(key == 'pv'){
        this.setQueryGraphPv(result[0],result[1])}
        else if(key == 'bat'){
        this.setQueryGraphBat(result[0],result[1])}
      break;
    case "6":
      date.setDate(date.getDate()-4)
      result = this.getDateForGraph(date)
      if(key == 'gen'){
        this.setQueryGraphGen(result[0],result[1])}
        else if(key == 'fc'){
        this.setQueryGraphFc(result[0],result[1])}
        else if(key == 'pv'){
        this.setQueryGraphPv(result[0],result[1])}
        else if(key == 'bat'){
        this.setQueryGraphBat(result[0],result[1])}
      break;
    case "7":
      date.setDate(date.getDate()-5)
      result = this.getDateForGraph(date)
      if(key == 'gen'){
        this.setQueryGraphGen(result[0],result[1])}
        else if(key == 'fc'){
        this.setQueryGraphFc(result[0],result[1])}
        else if(key == 'pv'){
        this.setQueryGraphPv(result[0],result[1])}
        else if(key == 'bat'){
        this.setQueryGraphBat(result[0],result[1])}
      break;
    case "8":
        date.setDate(date.getDate()-6)
        result = this.getDateForGraph(date)
        if(key == 'gen'){
          this.setQueryGraphGen(result[0],result[1])}
          else if(key == 'fc'){
          this.setQueryGraphFc(result[0],result[1])}
          else if(key == 'pv'){
          this.setQueryGraphPv(result[0],result[1])}
          else if(key == 'bat'){
          this.setQueryGraphBat(result[0],result[1])}
        break;
    default:
        date.setDate(date.getDate()+1)
        result = this.getDateForGraph(date)
          this.setQueryGraphGen(result[0],result[1])
          this.setQueryGraphFc(result[0],result[1])
          this.setQueryGraphPv(result[0],result[1])
          this.setQueryGraphBat(result[0],result[1])
        // console.log(result)
        break;
  }


}

 renameKey(json){

  for (let i in json){
    json[i]["y"] = json[i]["power"]
    json[i]["x"] = json[i]["time"]
     }
     return json
 }

 renameKey2(json){

  for (let i in json){
    json[i]["y"] = json[i]["load"]
    json[i]["x"] = json[i]["time"]
     }
     return json
 }


}
