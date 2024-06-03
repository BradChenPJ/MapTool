<template>
  <div>
    <div>
      <button @click="buttonDrawLine()">畫線段</button>
      <button @click="buttonDrawArc()">畫弧線</button>
      <button @click="buttonEdit()">編輯</button>
      <button @click="buttonDrawComplete()">完成</button>
      <h2 style="color:red">{{title}}</h2>
    </div>
    <div id="mapContainer">
      <canvas 
        id="mycanvas"  
        style='border:1px solid #000;'
      ></canvas>
    </div>
  </div>
</template>

<script setup>
  import { onMounted,ref } from 'vue';
  import Map from '@arcgis/core/Map';
  import MapView from '@arcgis/core/views/MapView';
  import Point from "@arcgis/core/geometry/Point";
  //地圖
  const map = new Map({
    basemap: "osm"
  });
  const mapview = new MapView({
    map: map,
    center: [121.533383, 25.062537],
    zoom: 10
  });
  
  const canvas = ref(null)
  const ctx = ref(null)
  const title = ref("完成")
  //存放圖形的陣列
  var shapes = []; //一組一組
  var linePoint_list = [] //一條polyLine的所有點
  var linePointScreen_list = []
  var linetest=[1,2,3]
 
  //點選按鈕選項
  var isButtonDrawLine = false;
  var isButtonDrawArc = false;
  var isButtonDrawEdit = false;
  var isButtonDrawComplete = true;

  //拉弧線
  var isDragArcControl = false;
 
  //編輯
  var isDragEdit = false;

  //是否載入mapView drag 的事件
  var isDragMapEvent = false;
  var dragMapEvent = null;

  //滑鼠點選到的
  var selectedPointIndex;
  var selectedShapeIndex;


  onMounted(()=>{
    mapview.container = "mapContainer"  //裝到container(div)裡面
    canvas.value = document.getElementById("mycanvas");
    canvas.value.width=1000;
    canvas.value.height=1000;
    ctx.value = canvas.value.getContext('2d');
    drawAll();
  })

  const drawAll = ()=>{
    // //一般個別的產生
    // //圓形
    // ctx.value.fillStyle="#FF0000";
    // ctx.value.beginPath();
    // ctx.value.arc(30, 30, 15, 0, 2*Math.PI);
    // ctx.value.closePath();
    // ctx.value.fill();
    // // 矩形
    // ctx.value.fillStyle = "#0000ff";
    // ctx.value.fillRect(100, -1, 75, 35);

    ctx.value.clearRect(0,0,1000,1000); //清除畫板
    for(var shapeIndex = 0; shapeIndex < shapes.length; shapeIndex++){
      var shape = shapes[shapeIndex];
      var screenPoints = shape.linePoints.map((each) => {return WGS84ToCanvasPosition(canvas.value,each)}) //經緯度換算螢幕坐標
      shape.linePointsScreen = screenPoints;  //更新原本的螢幕座標
      if(shape.type == 'line'){
        //畫polyline
        ctx.value.beginPath();
        ctx.value.moveTo(screenPoints[0].x,screenPoints[0].y);
        for(var i=1; i < screenPoints.length; i++){
          if(screenPoints[i].cp == false){
            //線段
            ctx.value.lineTo(screenPoints[i].x, screenPoints[i].y);
          }else{
            //弧線
            ctx.value.quadraticCurveTo(screenPoints[i].x,screenPoints[i].y,screenPoints[i+1].x,screenPoints[i+1].y)
            i++;
          }
        }
        ctx.value.strokeStyle = shape.color;
        ctx.value.lineWidth = shape.width;
        ctx.value.stroke();
        //畫polyline的節點
        for(var i=0; i < screenPoints.length; i++){
          if(screenPoints[i].cp == false){
            //線段節點
            ctx.value.beginPath();
            ctx.value.arc(screenPoints[i].x, screenPoints[i].y, 5, 0, Math.PI*2);
            ctx.value.strokeStyle = shape.color;
            ctx.value.stroke();
          }else{
            //弧線cp
            ctx.value.beginPath();
            ctx.value.arc(screenPoints[i].x, screenPoints[i].y, 5, 0, Math.PI*2);
            ctx.value.strokeStyle = 'red';
            ctx.value.stroke();
          }
          
        }
      }else if(shape.type == 'curve'){
        //當有curve的值時，畫曲線
        ctx.value.beginPath();
        ctx.value.moveTo(shape.x,shape.y);
        ctx.quadraticCurveTo(shape.xc, shape.yc, shape.x2, shape.y2);
        ctx.value.strokeStyle = 'green';
        ctx.value.lineWidth = 10;
        ctx.value.stroke();
      }
    }    
  }

  const buttonDrawLine = () =>{
    title.value = "畫線段...";
    isButtonDrawComplete = false;
    isButtonDrawLine = true;
    isButtonDrawArc = false;
    isButtonDrawEdit = false;
    isDragEdit = false;
    isDragArcControl = false;
    //新的線,初始化
    linePoint_list = []
    linePointScreen_list = []
  }
  const buttonDrawArc = () =>{
    title.value = "畫弧線...";
    isButtonDrawComplete = false;
    isButtonDrawLine = false;
    isButtonDrawArc = true;
    isButtonDrawEdit = false;
    isDragEdit = false;
    isDragArcControl = false;
  }
  const buttonDrawComplete = () =>{
    title.value = "完成";
    isButtonDrawComplete = true;
    isButtonDrawLine = false; 
    isButtonDrawArc = false;
    isDragEdit = false;
    isDragArcControl = false;
  }
  const buttonEdit = () => {
    title.value = "編輯中...";
    isButtonDrawComplete = false;
    isButtonDrawLine = false;
    isButtonDrawArc = false;
    isButtonDrawEdit = true;
    isDragEdit = false;
    isDragArcControl = false;
  }

  //測試
  mapview.on('click',(event)=>{
    if(isButtonDrawLine){
      linePoint_list.push({ x: event.mapPoint.longitude, y: event.mapPoint.latitude, cp:false });  //cp用來判斷是不是control point(curve有control point)//存經緯度
      linePointScreen_list.push({ x: event.x, y: event.y, cp:false }) //cp用來判斷是不是control point(curve有control point)//存螢幕x,y
      // var screenPoint = WGS84ToCanvasPosition(canvas.value, { x: event.mapPoint.longitude, y: event.mapPoint.latitude, cp:false })
      // linePointScreen_list.push(x:)
      //linePoint_list.push({ x: event.mapPoint.longitude, y: event.mapPoint.latitude, cp:false });  //cp用來判斷是不是control point(curve有control point)//存經緯度
      let lineObj = {
        type: "line",
        color: "green",
        width: 5,
        linePoints: linePoint_list,
        linePointsScreen: linePointScreen_list
      }
      if(linePoint_list.length == 1){
        //點第一個點
        shapes.push(lineObj);
      }else{
        //第二個點後更新已經放入shapes的lineObj
        shapes[shapes.length-1] = lineObj
      }
      drawAll();
    }
  })
  //地圖上的滑鼠event
  mapview.on('pointer-down', (event) => {
    // //取得點擊滑鼠的x,y座標(canvas座標系統)
    // let mouse = mouseCanvasPosition(canvas.value, event);
    if(isButtonDrawLine){
      // var wgs84point = CanvasPositionToWGS84({x:event.x, y:event.y, cp:false})
      // linePoint_list.push(wgs84point);  //cp用來判斷是不是control point(curve有control point)//存經緯度
      // linePointScreen_list.push({ x: event.x, y: event.y, cp:false }) //cp用來判斷是不是control point(curve有control point)//存螢幕x,y
      // var lineObj = {
      //   type: "line",
      //   color: "green",
      //   width: 5,
      //   linePoints: linePoint_list,
      //   linePointsScreen: linePointScreen_list
      // }
      // if(linePoint_list.length == 1){
      //   //點第一個點
      //   shapes.push(lineObj);
      // }else{
      //   //第二個點後更新已經放入shapes的lineObj
      //   shapes[shapes.length-1] = lineObj
      // }
      // drawAll();
    }else if (isButtonDrawArc){ 
      for(var shapeIndex=shapes.length-1; shapeIndex>-1; shapeIndex--){
        var shape = shapes[shapeIndex];
        //找到是line的//先考慮都是line的
        if(shape.type == "line"){
          for(var i=0; i < shape.linePointsScreen.length -1 ; i++){
            ctx.value.beginPath();
            ctx.value.moveTo(shape.linePointsScreen[i].x,shape.linePointsScreen[i].y);
            ctx.value.lineTo(shape.linePointsScreen[i+1].x,shape.linePointsScreen[i+1].y);
            //滑鼠點到這兩個點構成的線段上
            if(ctx.value.isPointInStroke(event.x, event.y)){
              isDragArcControl = true;
              selectedPointIndex = i;
              selectedShapeIndex = shapeIndex;
              dragMapEvent = mapview.on("drag", (event) => {event.stopPropagation();});
              isDragMapEvent = true;
              //先加入一個cp點的位置
              shapes[selectedShapeIndex].linePoints.splice(selectedPointIndex+1, 0, CanvasPositionToWGS84({x:event.x, y:event.y, cp:true}));
              shapes[selectedShapeIndex].linePointsScreen.splice(selectedPointIndex+1, 0, {x: event.x, y: event.y, cp: true});
              return;
            }
          }
        }
      }
    }else if(isButtonDrawEdit){ 
      for(var shapeIndex=shapes.length-1; shapeIndex>-1; shapeIndex--){
        var shape = shapes[shapeIndex];
        for(var i=0; i < shape.linePointsScreen.length; i++){
          ctx.value.beginPath();
          ctx.value.arc(shape.linePointsScreen[i].x, shape.linePointsScreen[i].y, 5, 0, Math.PI*2);
          //滑鼠點到圈圈
          if(ctx.value.isPointInPath(event.x, event.y)){
            isDragEdit = true;
            selectedPointIndex = i;
            selectedShapeIndex = shapeIndex;
            dragMapEvent = mapview.on("drag", (event) => {event.stopPropagation();});
            isDragMapEvent = true;
          }
        }
      }
    }
  })
  mapview.on('pointer-move', (event) =>{ 
    if(isDragArcControl){
      shapes[selectedShapeIndex].linePoints[selectedPointIndex+1] = CanvasPositionToWGS84({x:event.x, y:event.y, cp:true});
      shapes[selectedShapeIndex].linePointsScreen[selectedPointIndex+1] = {x: event.x, y: event.y, cp: true};
      drawAll();
    }else if(isDragEdit){
      var wgs84point = CanvasPositionToWGS84({x:event.x, y:event.y, cp:true})
      shapes[selectedShapeIndex].linePoints[selectedPointIndex].x = wgs84point.x;
      shapes[selectedShapeIndex].linePoints[selectedPointIndex].y = wgs84point.y;
      shapes[selectedShapeIndex].linePointsScreen[selectedPointIndex].x = event.x;
      shapes[selectedShapeIndex].linePointsScreen[selectedPointIndex].y = event.y;
      drawAll();
    }
  })
  mapview.on('pointer-up', (event) => {
    isDragEdit = false;
    isDragArcControl = false;
    if(isDragMapEvent){
      dragMapEvent.remove();
      dragMapEvent = null;
      isDragMapEvent = false;
    }
  })
  // mapview.on('pointer-leave', (event) => {

  // })
  mapview.on('drag', (event) => {
    drawAll();
  })
  mapview.on('mouse-wheel',(event) =>{
    //滾輪縮放比算點為慢，因此設timeout讓縮放先就定位
    setTimeout(()=>{drawAll()},150);    
  })
  
  const mouseCanvasPosition = (canvas, event) =>{
    var ClientRect = canvas.getBoundingClientRect();
    return {
      x: Math.round(event.clientX - ClientRect.left),
      y: Math.round(event.clientY - ClientRect.top)
    }
  }
  const WGS84ToCanvasPosition = (canvas, point) => {
    var ClientRect = canvas.getBoundingClientRect();
    const clikcPoint = new Point({
      type:'point',
      longitude: point.x,
      latitude: point.y
    })
    const screenPoint = mapview.toScreen(clikcPoint);
    // return{
    //   x: Math.round(screenPoint.x - ClientRect.left),
    //   y: Math.round(screenPoint.y - ClientRect.top)
    // }
    //轉換後的x, y就是canvas的坐標
    return {
      x:screenPoint.x,
      y:screenPoint.y,
      cp:point.cp
    }
  }
  const CanvasPositionToWGS84 = (point) => {
      const wgs84Point = mapview.toMap(point);
      return{
        x:wgs84Point.longitude,
        y:wgs84Point.latitude,
        cp:point.cp
      }
    }
  const isMouseInShape = (mx,my,shape)=>{
    // 圓形範圍
    if('radius' in shape){
      var dx = mx - shape.x;
      var dy = my - shape.y;
      if(dx*dx + dy*dy < shape.radius*shape.radius){
        return(true);
      }else{
        return(false);
      }
    }else if('width' in shape){
      // 矩形範圍
      var rLeft = shape.x;
      var rRight = shape.x + shape.width;
      var rTop = shape.y;
      var rBott = shape.y + shape.height;
      if( mx > rLeft && mx < rRight && my > rTop && my < rBott){
        return(true);
      }else{
        return(false);
      }
    }else if('line' in shape){
      //為了判斷有沒有交集因此beginPath但不stroke
      ctx.value.beginPath();                        
      ctx.value.moveTo(shape.x, shape.y);     
      ctx.value.lineTo(shape.x2, shape.y2);
      if(ctx.value.isPointInStroke(mx,my)){
        return(true);
      }else{
        return(false);
      }
    }
  }
</script>
<style scoped>
#mapContainer{
  position: relative;
  width: 1000px;
  height: 1000px;
}
#mycanvas{
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
}
</style>
