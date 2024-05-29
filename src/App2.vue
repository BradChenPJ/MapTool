<template>
  <div>
    <button @click="buttonDrawLine()">畫線段</button>
    <button @click="buttonDrawArc()">畫弧線</button>
    <button @click="buttonEdit()">編輯</button>
    <button @click="buttonDrawComplete()">完成</button>
    <h2 style="color:red">{{title}}</h2>
  </div>
  <canvas 
    id="mycanvas"  
    style='border:1px solid #000;'
    @mousedown="onMouseDown($event)"
    @mouseup="onMouseUp($event)"
    @mousemove="onMouseMove($event)"
    @mouseout="onMouseOut($event)"
  ></canvas>
  
  
</template>

<script setup>
  import { onMounted,ref } from 'vue';

  const canvas = ref(null)
  const ctx = ref(null)
  const title = ref("完成")
  //存放圖形的陣列
  var shapes = []; //一組一組
  var linePoint_list = [] //一條polyLine的所有點
  
 
  //點選按鈕選項
  var isDrawLine = false;
  var isDrawArc = false;
  var isEdit = false;
  var isDrawComplete = true;

  //拉弧線
  var isDragArcControl = false;
 
  //編輯
  var isDragEdit = false;

  //滑鼠點選到的
  var selectedPointIndex;
  var selectedShapeIndex;


  onMounted(()=>{
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
      if(shape.type == 'line'){
        //畫polyline
        ctx.value.beginPath();
        ctx.value.moveTo(shape.linePoints[0].x,shape.linePoints[0].y);
        for(var i=1; i < shape.linePoints.length; i++){
          if(shape.linePoints[i].cp == false){
            //線段
            ctx.value.lineTo(shape.linePoints[i].x, shape.linePoints[i].y);
          }else{
            //弧線
            ctx.value.quadraticCurveTo(shape.linePoints[i].x,shape.linePoints[i].y,shape.linePoints[i+1].x,shape.linePoints[i+1].y)
            i++;
          }
        }
        ctx.value.strokeStyle = shape.color;
        ctx.value.lineWidth = shape.width;
        ctx.value.stroke();
        //畫polyline的節點
        for(var i=0; i < shape.linePoints.length; i++){
          if(shape.linePoints[i].cp == false){
            //線段節點
            ctx.value.beginPath();
            ctx.value.arc(shape.linePoints[i].x, shape.linePoints[i].y, 5, 0, Math.PI*2);
            ctx.value.strokeStyle = shape.color;
            ctx.value.stroke();
          }else{
            //弧線cp
            ctx.value.beginPath();
            ctx.value.arc(shape.linePoints[i].x, shape.linePoints[i].y, 5, 0, Math.PI*2);
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
    isDrawComplete = false;
    isDrawLine = true;
    isDrawArc = false;
    isEdit = false;
    isDragEdit = false;
    isDragArcControl = false;
    //新的線
    linePoint_list = []
  }
  const buttonDrawArc = () =>{
    title.value = "畫弧線...";
    isDrawComplete = false;
    isDrawLine = false;
    isDrawArc = true;
    isEdit = false;
    isDragEdit = false;
    isDragArcControl = false;
  }
  const buttonDrawComplete = () =>{
    title.value = "完成";
    isDrawComplete = true;
    isDrawLine = false; 
    isDrawArc = false;
    isDragEdit = false;
    isDragArcControl = false;
  }
  const buttonEdit = () => {
    title.value = "編輯中...";
    isDrawComplete = false;
    isDrawLine = false;
    isDrawArc = false;
    isEdit = true;
    isDragEdit = false;
    isDragArcControl = false;
  }

  const onMouseDown = (event) =>{
    //取得點擊滑鼠的x,y座標(canvas座標系統)
    let mouse = mouseCanvasPosition(canvas.value, event);
    if(isDrawLine){
      linePoint_list.push({ x: mouse.x, y: mouse.y, cp:false });  //cp用來判斷是不是control point(curve有control point)
      var lineObj = {
        type: "line",
        color: "green",
        width: 5,
        linePoints: linePoint_list
      }
      if(linePoint_list.length == 1){
        //點第一個點
        shapes.push(lineObj);
      }else{
        //第二個點後更新已經放入shapes的lineObj
        shapes[shapes.length-1] = lineObj
      }
      drawAll();
    }else if (isDrawArc){
      for(var shapeIndex=shapes.length-1; shapeIndex>-1; shapeIndex--){
        var shape = shapes[shapeIndex];
        //找到是line的//先考慮都是line的
        if(shape.type == "line"){
          for(var i=0; i < shape.linePoints.length -1 ; i++){
            ctx.value.beginPath();
            ctx.value.moveTo(shape.linePoints[i].x,shape.linePoints[i].y);
            ctx.value.lineTo(shape.linePoints[i+1].x,shape.linePoints[i+1].y);
            //滑鼠點到這兩個點構成的線段上
            if(ctx.value.isPointInStroke(mouse.x, mouse.y)){
              isDragArcControl = true;
              selectedPointIndex = i;
              selectedShapeIndex = shapeIndex;
              //先加入一個cp點的位置
              shapes[selectedShapeIndex].linePoints.splice(selectedPointIndex+1, 0, {x: mouse.x, y: mouse.y, cp: true});
              return;
            }
          }
        }
      }
    }else if(isEdit){
      for(var shapeIndex=shapes.length-1; shapeIndex>-1; shapeIndex--){
        var shape = shapes[shapeIndex];
        for(var i=0; i < shape.linePoints.length; i++){
          ctx.value.beginPath();
          ctx.value.arc(shape.linePoints[i].x, shape.linePoints[i].y, 5, 0, Math.PI*2);
          //滑鼠點到圈圈
          if(ctx.value.isPointInPath(mouse.x, mouse.y)){
            console.log("in")
            isDragEdit = true;
            selectedPointIndex = i;
            selectedShapeIndex = shapeIndex;
          }
        }
      }
    }
  }
    
  const onMouseMove = (event) =>{
    let mouse = mouseCanvasPosition(canvas.value, event);
    if(isDragArcControl){
      //取得滑動滑鼠的x,y座標(canvas座標系統)
      shapes[selectedShapeIndex].linePoints[selectedPointIndex+1] = {x: mouse.x, y: mouse.y, cp: true};
      drawAll();
    }else if(isDragEdit){
      shapes[selectedShapeIndex].linePoints[selectedPointIndex].x = mouse.x;
      shapes[selectedShapeIndex].linePoints[selectedPointIndex].y = mouse.y;
      drawAll();
    }
  }
  const onMouseUp = (event) =>{
    // if(!isDragArcControl){ 
    //   return; 
    // }
    event.preventDefault();
    event.stopPropagation();
    isDragEdit = false;
    isDragArcControl = false;
  }
  const onMouseOut = (event) =>{
    // if(!isDragging){ 
    //   return; 
    // }
    // event.preventDefault();
    // event.stopPropagation();
    // isDragging = false;
    // console.log("out")
  }
  
  const mouseCanvasPosition = (canvas, event) =>{
    var ClientRect = canvas.getBoundingClientRect();
    return {
      x: Math.round(event.clientX - ClientRect.left),
      y: Math.round(event.clientY - ClientRect.top)
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

