<template>
  <div>
    <button @click="buttonDrawLine()">畫線段</button>
    <button @click="buttonDrawArc()">弧線</button>
    <button @click="buttonDrawComplete()">完成</button>
  </div>
  <canvas 
    id="mycanvas"  
    style='border:1px solid #000;'
    @mousedown="onMouseDown($event)"
    @mouseup="onMouseUp($event)"
    @mousemove="onMouseMove($event)"
    @mouseout="onMouseOut($event)"
    @click="onMouseClick($event)"
  ></canvas>
  
  
</template>

<script setup>
  import { onMounted,ref } from 'vue';

  const canvas = ref(null)
  const ctx = ref(null)
  //存放圖形的陣列
  var shapes = [];
  shapes.push( {x:300, y:300, radius:150, color:'blue'} );
  shapes.push( {x:0, y:0, width:750, height:350, color:'red'} );
  //以canva左上為原點的滑鼠位置(canva坐標)
  var startX;
  var startY;
  // 選到的圖形的index
  var selectedShapeIndex;
  //canva與視窗左側的距離,canva與視窗上方的距離
  var offsetX = null;
  var offsetY = null;

  // 拖移的變數
  var isDragging = false;
  //點選按鈕選項
  var isDrawLine = false;
  var isDrawLineClick = 0;
  var isDrawArc = false;
  var isDrawComplete = true;
  


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
    for(var i = 0; i < shapes.length; i++){
      var shape = shapes[i];
      if(shape.radius){
        // 當有 radius 的值時，產生圓形
        ctx.value.beginPath();
        ctx.value.arc(shape.x, shape.y, shape.radius, 0, Math.PI*2);
        ctx.value.fillStyle = shape.color;
        ctx.value.fill();
      }else if(shape.width){
        // 當有 width 的值時，產生矩形
        ctx.value.fillStyle = shape.color;
        ctx.value.fillRect(shape.x, shape.y, shape.width, shape.height);
      }else if(shape.line){
        //當有line的值時，畫線
        ctx.value.beginPath();
        ctx.value.moveTo(shape.x,shape.y);
        ctx.value.lineTo(shape.x2,shape.y2);
        ctx.value.strokeStyle = 'green';
        ctx.value.lineWidth = 10;
        ctx.value.stroke();
      }else if(shape.curve){
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
    isDrawComplete = false;
    isDrawLine = true;
  }
  const buttonDrawArc = () =>{}
  const buttonDrawComplete = () =>{
    isDrawComplete = true;
    isDrawLine = false;
    isDrawLineClick = 0;
    isDrawArc = false;
    console.log(shapes)
  }

  const onMouseDown = (event) =>{
    if(isDrawComplete){
      // tell the browser we're handling this event
      event.preventDefault();
      event.stopPropagation();
      //計算滑鼠點擊在canva的位置(canva坐標)
      reOffset();
      startX=parseInt(event.clientX-offsetX);
      startY=parseInt(event.clientY-offsetY);
      //對所有的shape做測試，看哪個滑鼠在哪個shape上
      //從list後面開始，因為後面的會被畫在上層
      for(var i=shapes.length-1; i>-1; i--){
        if(isMouseInShape(startX,startY,shapes[i])){
          selectedShapeIndex=i;
          isDragging=true;
          return;
        }
      }
    }
  }
  const onMouseMove = (event) =>{
    // tell the browser we're handling this event
    event.preventDefault();
    event.stopPropagation();
    if(isDrawComplete){
      if(!isDragging){
        return;
      }
      // 計算滑鼠現在在canva的位置        
      var mouseX=parseInt(event.clientX-offsetX);
      var mouseY=parseInt(event.clientY-offsetY);
      // 計算滑鼠和一開始mouseDown位置(開始位置)的差值
      var dx=mouseX-startX;
      var dy=mouseY-startY;
      // 將差值加入圖形的xy(拉動圖形多少)
      var selectedShape=shapes[selectedShapeIndex];
      selectedShape.x+=dx;
      selectedShape.y+=dy;
      //如果是線的話，第二點也要加差值
      if(selectedShape.line){
        selectedShape.x2+=dx;
        selectedShape.y2+=dy;
      }
      //將圖畫出來
      drawAll();
      //更新滑鼠開始位置
      startX = mouseX;
      startY = mouseY;
    }else{
      //點擊畫線按鈕以及canvas有點一下了
      if(isDrawLine && isDrawLineClick == 1){
        // 計算滑鼠現在在canva的位置        
        var mouseX=parseInt(event.clientX-offsetX);
        var mouseY=parseInt(event.clientY-offsetY);
        var selectedShape = shapes[selectedShapeIndex];
        selectedShape.x2 = mouseX;
        selectedShape.y2 = mouseY;
        drawAll();
      }else if(isDrawLine && isDrawLineClick == 2){
        isDrawLineClick = 0;
        shapes.pop();
        drawAll();
      }
    }
  }
  const onMouseClick = (event) => {
    if(!isDrawComplete){
      //點擊畫線
      if(isDrawLine){
        event.preventDefault();
        event.stopPropagation();
        //計算滑鼠點擊在canva的位置(canva坐標)
        reOffset();
        startX=parseInt(event.clientX-offsetX);
        startY=parseInt(event.clientY-offsetY);
        shapes.push( {x:startX, y:startY, x2:0, y2:0, line:true, color:'green'} );
        selectedShapeIndex = shapes.length - 1;
        isDrawLineClick += 1;
      }
    }

  }
  const onMouseUp = (event) =>{
    if(!isDragging){ 
      return; 
    }
    event.preventDefault();
    event.stopPropagation();
    isDragging = false;
    console.log("up")
  }
  const onMouseOut = (event) =>{
    if(!isDragging){ 
      return; 
    }
    event.preventDefault();
    event.stopPropagation();
    isDragging = false;
    console.log("out")
  }
  const reOffset = () =>{
    var BB=canvas.value.getBoundingClientRect();
    offsetX=BB.left;
    offsetY=BB.top;       
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

