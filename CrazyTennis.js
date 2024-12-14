let ground_color, sky_color, wall_color, skydiv;
let screen = [], screen_net = [];
let ennemy, ball, ball_shadow, ball_marker;

let song, ball_sound, fallen_sound, relaunch_sound

const FOV = 80;
const HALF_FOV = FOV / 2;
const conversion = Math.PI / 180;
let ray_number = 100

let initial_x = 70
let player_x = initial_x, player_y = 50, player_angle = 270;
let ennemy_x = initial_x, ennemy_y = 130, ennemyHeight = 0.7
let ball_x = initial_x, ball_y = 90, ball_z = 25, ballHeight = 0.1
let ball_energy = 0.4, ball_lift = 0, ball_angle = 90, ballHasBeenHit = false
let ball_is_fallen = false, next_launch_frame

let score_player = 0, score_ennemy = 0, score_tab

let game = false, a, b

//each cell of the map is divided in 20 "subcells"
//the player's position is in subcells

//90° represents pointing upwards, and the angles are rotating counter-clockwise

let map = [
  [1,  1,  1,  1,  1,  1,  1],
  [1,  0,  0,  0,  0,  0,  1],
  [1,  0,  0,  0,  0,  0,  1],
  [1,  0,  0,  0,  0,  0,  1],
  [1,0.3,0.3,0.3,0.3,0.3,  1],
  [1,  0,  0,  0,  0,  0,  1],
  [1,  0,  0,  0,  0,  0,  1],
  [1,  0,  0,  0,  0,  0,  1],
  [1,  1,  1,  1,  1,  1,  1]
];

function up(angle) {
  return angle <= 180;
}
function down(angle) {
  return angle >= 180;
}
function left(angle) {
  return angle >= 90 && angle <= 270;
}
function right(angle) {
  return angle >= 270 || angle <= 90;
}
function randInt(a,b){
  return Math.floor(Math.random() * (b - a) + a)
}

function preload(){
  song = loadSound("Karsten Koch - Aryx.mp3")
  ball_sound = loadSound("tennis-ball-hit-151257.mp3")
  
  relaunch_sound = loadSound("sf_sifflet_05.mp3")
  fallen_sound = loadSound("sf_sifflet_06.mp3")
}
function setup() {
  ground_color = color(200, 200, 200);
  sky_color = color(2, 36, 252);
  wall_color = color(158,65,54)
  createCanvas(800, 800);
  
  skydiv = createDiv()
  let temp_stardiv
  for (i = 0; i != 30; i ++){
    temp_stardiv = createDiv()
    temp_stardiv.style("background-color", "lightyellow")
    temp_stardiv.position(randInt(-20,width), randInt(-20, height / 2))
    temp_stardiv.size(5, 5)
    
    skydiv.child(temp_stardiv)
  }
  
  for (i = 0; i != ray_number; i++) {
    screen[i] = createDiv();
    screen[i].style("background-color", wall_color);
  }
  if (randInt(0, 10) == 0){
    ennemy = createDiv("😈")
  }
  else {
    ennemy = createDiv("😎")
  }
  ennemy.style("z-index","1")
  ennemy.hide()
  ball = createDiv("🎾")
  ball.style("z-index","4")
  ball.hide()
  ball_shadow = createDiv()
  ball_shadow.style("clip-path", "ellipse(50% 20%)")
  ball_shadow.style("background-color", "black")
  ball_shadow.style("opacity", 0.5)
  ball_shadow.style("position", "absolute")
  ball_shadow.style("z-index", "0")
  for (i = 0; i != ray_number; i++) {
    screen_net[i] = createDiv();
    screen_net[i].style("background-color", "green")
    screen_net[i].style("z-index","3")
    screen_net[i].style("opacity", 0.8)
  }
  
  skydiv.hide()
  textSize(100)
  text("🎾", 360, 170)
  text("🎾", 440, 170)
  textSize(120)
  text("😎", 390, 150)
  text("CrazyTennis", 100, 300)
  
  textSize(30)
  text("Controls:", 390, 350)
  text("-Arrow keys to move\n"+
       "-Win 6 points to win the game\n"+
       "-Get close to the ball to hit it\n"+
       "-You can't hit the ball if it's too high!", 300, 390)
  textSize(60)
  text("Press ENTER to begin !", 100, 600)
}
function draw() {
  if (game) {
    if (!song.isPlaying()){
      song.play()
    }
    if (score_ennemy == 6){
      lose()
    }
    if (score_player == 6){
      win()
    }
    ennemy.hide()

    fill(sky_color);
    rect(0, 0, width, height / 2);
    fill(ground_color);
    rect(0, height / 2, width, height / 2);

    for (i = 0; i <= ray_number - 1; i++) {
      cast_ray(i);
    }
    display_ennemy()

    if (!ball_is_fallen){
      display_ball()
      move_ball()
    }
    else if (frameCount == next_launch_frame) {
      ball.show()
      ball_is_fallen = false
      relaunch_sound.play()
    }

    move_player();
    move_ennemy();
  }
  else {
    if (keyIsDown(ENTER)){
      score_tab = createDiv("<span style='color: aqua'>0</span> - <span style='color: red'>0</span>")
      score_tab.style("font-size","50px")
      score_tab.style("position", "absolute")
      score_tab.style("top", "0px")
      score_tab.style("background-color", "black")
      score_tab.style("color", "white")
      score_tab.style("justify-content", "center")
      score_tab.style("left", width / 2 - 40 + "px")
      
      score_player = 0
      score_ennemy = 0
      if (a != null && b != null){
        a.remove()
        b.remove()
      }
      
      player_x = initial_x
      player_y = 50
      
      skydiv.show()
      song.play()
      game = true
    }
  }
}

function move_player(){
  let new_x = player_x, new_y = player_y, change_angle = false
  if (keyIsDown(UP_ARROW)){
    new_y += 0.3
  }
  if (keyIsDown(DOWN_ARROW)){
    new_y -= 0.3
  }
  if (keyIsDown(LEFT_ARROW)){
    new_x += 0.3
  }
  if (keyIsDown(RIGHT_ARROW)){
    new_x -= 0.3
  }
  if (map[Math.floor(new_y / 20)][Math.floor(new_x / 20)] == 0) {
    player_x = new_x
    player_y = new_y
  }
}
function move_ennemy(){
  if (ball_x < ennemy_x - 5 && abs(ball_x - ennemy_x + 5) > 5){
    ennemy_x -= 0.3 * (0.2 * (score_player - score_ennemy) + 1)
  }
  else if (ball_x > ennemy_x - 5 && abs(ball_x - ennemy_x + 5) > 5){
    ennemy_x += 0.3 * (0.2 * (score_player - score_ennemy) + 1)
  }
  if (ball_y > ennemy_y){
    ennemy_y += 0.3 * (0.2 * (score_player - score_ennemy) + 1)
  }
  else {
    ennemy_y = constrain(ennemy_y - 0.3 * (0.2 * (score_player - score_ennemy) + 1), 110, ennemy_y)
  }
}
function move_ball(){
  if (ball_x < 20 && up(ball_angle)){
    ball_angle = 90 - abs(90 - ball_angle)
    ball_sound.play()
  }
  else if (ball_x < 20 && down(ball_angle)){
    ball_angle = 270 + abs(270 - ball_angle)
    ball_sound.play()
  }
  else if (ball_x > 120 && up(ball_angle)){
    ball_angle = 90 + abs(90 - ball_angle)
    ball_sound.play()
  }
  else if (ball_x > 120 && down(ball_angle)){
    ball_angle = 270 - abs(270 - ball_angle)
    ball_sound.play()
  }
  
  
  if (up(ball_angle) && left(ball_angle)){
    ball_x -= Math.sin(abs(ball_angle - 90) * conversion) * ball_energy
    ball_y -= Math.cos(abs(ball_angle - 90) * conversion) * ball_energy
  }
  else if (up(ball_angle) && right(ball_angle)){
    ball_x += Math.sin(abs(ball_angle - 90) * conversion) * ball_energy
    ball_y -= Math.cos(abs(ball_angle - 90) * conversion) * ball_energy
  }
  else if (down(ball_angle) && left(ball_angle)){
    ball_x -= Math.sin(abs(ball_angle - 270) * conversion) * ball_energy
    ball_y += Math.cos(abs(ball_angle - 270) * conversion) * ball_energy
  }
  else if (down(ball_angle) && right(ball_angle)){
    ball_x += Math.sin(abs(ball_angle - 270) * conversion) * ball_energy
    ball_y += Math.cos(abs(ball_angle - 270) * conversion) * ball_energy
  }
  ball_lift -= 0.002
  ball_z += ball_lift
  
  if (dist(player_x, player_y, ball_x, ball_y) < 5 && ball_z < 10 && !ballHasBeenHit && ball_z > 0){
    ballHasBeenHit = true
    ball_lift = 0.2
    ball_angle = 270 + randInt(-30,30)
    ball_sound.play()
  }
  else if (dist(ennemy_x -5, ennemy_y, ball_x, ball_y) < 5 && ball_z < 10 && !ballHasBeenHit && ball_z > 0){
    ballHasBeenHit = true
    ball_lift = 0.2
    ball_angle = 90 + randInt(-30,30)
    ball_sound.play()
  }
  else if (dist(player_x, player_y, ball_x, ball_y) > 10 && dist(ennemy_x + 5, ennemy_y, ball_x, ball_y) > 10){
    ballHasBeenHit = false
  }
  
  if (ball_z < 0 || ball_y > 160){
    if (ball_y > 90){
      score_player += 1
    }
    else {
      score_ennemy += 1
    }
    ball_x = initial_x
    ball_y = 90
    ball_z = 25
    ball_lift = 0
    ball_angle = 90
    ballHasBeenHit = false
    
    ball_is_fallen = true
    next_launch_frame = frameCount + 300
    ball.hide()
    ball_shadow.hide()
    
    score_tab.html("<span style='color: aqua'>"+score_player+"</span> - <span style='color: red'>"+score_ennemy+"</span>")
    
    fallen_sound.play()
  }
}

function display_ennemy(){
  ennemy.hide()
  
  let a_x, a_y, d = dist(player_x, player_y, ennemy_x, ennemy_y)
  if (up(player_angle) && left(player_angle)) {
    a_x = player_x - Math.sin(abs(player_angle - 90) * conversion) * d;
    a_y = player_y - Math.cos(abs(player_angle - 90) * conversion) * d;
  } else if (up(player_angle) && right(player_angle)) {
    a_x = player_x + Math.sin(abs(player_angle - 90) * conversion) * d;
    a_y = player_y - Math.cos(abs(player_angle - 90) * conversion) * d;
  } else if (down(player_angle) && left(player_angle)) {
    a_x = player_x - Math.sin(abs(player_angle - 270) * conversion) * d;
    a_y = player_y + Math.cos(abs(player_angle - 270) * conversion) * d;
  } else if (down(player_angle) && right(player_angle)) {
    a_x = player_x + Math.sin(abs(player_angle - 270) * conversion) * d;
    a_y = player_y + Math.cos(abs(player_angle - 270) * conversion) * d;
  }
  
  let p = dist(ennemy_x, ennemy_y, a_x, a_y)
  let alpha = Math.acos((p*p - 2*d*d)/(-2*d*d))/conversion
  
  if (alpha < HALF_FOV - 2){
    if (a_x < ennemy_x){
      alpha = -alpha
    }
    ennemy.position(width / 2 + (alpha * width / 2) / HALF_FOV, height / 2 - height * 0.0025)
    ennemy.style("font-size",constrain((20 * 300) / d,0,height) * ennemyHeight + "px")
    ennemy.show()
  }
}
function display_ball(){
  ball.hide()
  ball_shadow.hide()
  
  let a_x, a_y, d = dist(player_x, player_y, ball_x, ball_y)
  
  if (ball_y < 90){
    ball.style("z-index","5")  
  }
  else {
    ball.style("z-index", "0")
  }
  
  if (up(player_angle) && left(player_angle)) {
    a_x = player_x - Math.sin(abs(player_angle - 90) * conversion) * d;
    a_y = player_y - Math.cos(abs(player_angle - 90) * conversion) * d;
  } else if (up(player_angle) && right(player_angle)) {
    a_x = player_x + Math.sin(abs(player_angle - 90) * conversion) * d;
    a_y = player_y - Math.cos(abs(player_angle - 90) * conversion) * d;
  } else if (down(player_angle) && left(player_angle)) {
    a_x = player_x - Math.sin(abs(player_angle - 270) * conversion) * d;
    a_y = player_y + Math.cos(abs(player_angle - 270) * conversion) * d;
  } else if (down(player_angle) && right(player_angle)) {
    a_x = player_x + Math.sin(abs(player_angle - 270) * conversion) * d;
    a_y = player_y + Math.cos(abs(player_angle - 270) * conversion) * d;
  }
  
  let p = dist(ball_x, ball_y, a_x, a_y)
  let alpha = Math.acos((p*p - 2*d*d)/(-2*d*d))/conversion
  
  if (alpha < HALF_FOV - 2){
    if (a_x < ball_x){
      alpha = -alpha
    }
    let default_sliceHeight = ((20 * 300) / d)
    let top = ((height - default_sliceHeight) / 2)
    let sliceHeight = (ball_z * 300) / d
    let onscreen_ball_y = Math.floor(default_sliceHeight - sliceHeight + top)
    if (onscreen_ball_y > 0 && onscreen_ball_y < height) {
      ball.position(width / 2 + (alpha * width / 2) / HALF_FOV, onscreen_ball_y)
      ball.style("font-size",constrain((20 * 300) / d,0,height) * ballHeight + "px")
      ball.show()
    }
    sliceHeight = constrain((20*300)/d, 0, height)
    let onscreen_shadow_y = Math.floor(sliceHeight + ((height - sliceHeight) / 2))
    if (onscreen_shadow_y > 0 && onscreen_shadow_y < height) {
      ball_shadow.position(width / 2 + (alpha * width / 2) / HALF_FOV, onscreen_shadow_y)
      ball_shadow.style("font-size",constrain((20 * 300) / d,0,height) * ballHeight + "px")
      ball_shadow.size(constrain((20 * 300) / d,0,height) * ballHeight,constrain((20 * 300) / d,0,height) * ballHeight)
      ball_shadow.show()
    }
  }
  else {
    fill("yellow")
    if (ball_x > player_x && ball_y >= player_y){
      triangle(10, 10, 10, 10 + (height / 10), 10 + (width / 10), 10)
    }
    else if (ball_x < player_x && ball_y >= player_y){
      triangle(width - 10 - (width / 10), 10, width - 10, 10, width - 10, 10 + (height / 10))
    }
    else if (ball_x >= player_x && ball_y <= player_y){
      triangle(10, height - 10 - (height / 10), 10, height - 10, 10 + (width / 10), height - 10)
    }
    else if (ball_x <= player_x && ball_y <= player_y){
      triangle(width - 10, height - 10 - (height / 10), width - 10, height - 10, width - 10 - (width / 10), height - 10)
    }
  }
}

function cast_ray(i) {
  let alpha, angle = (player_angle + HALF_FOV - i * (FOV / screen.length)) % 360;

  let ref_angle,cell_value,counter = 0, hit_net = false;
  let signy, signx;
  let ray_x, ray_y;
  
  let netHeight, displayed_ennemyHeight, sliceHeight
  
  if (up(angle)) {
    ref_angle = 90;
    signy = -1;
  } else if (down(angle)) {
    ref_angle = 270;
    signy = 1;
  }
  if (left(angle)) signx = -1;
  if (right(angle)) signx = 1;
  alpha = abs(angle - ref_angle);
  
  while (true) {
    ray_x = Math.floor((player_x + signx * Math.sin(alpha * conversion) * counter) /20)
    ray_y = Math.floor((player_y + signy * Math.cos(alpha * conversion) * counter) /20)
    cell_value = map[ray_y][ray_x]
    if (cell_value != 0) {
      if (cell_value == 1){
        break;
      }
      else if (!hit_net) {
        hit_net = true
        netHeight = constrain((20 * 300) / counter,0,height)
        screen_net[i].position((i * width) / screen_net.length,Math.floor((height - netHeight) / 2) + Math.floor(netHeight * (1 - cell_value)));
        screen_net[i].size(width / ray_number, netHeight * cell_value);
      }
    }
    counter++;
  }
  
  sliceHeight = constrain((20 * 300) / counter,0,height)
  
  if (!hit_net){
    screen_net[i].size(0,0)
  }
  
  screen[i].position((i * width) / screen.length, Math.floor((height - sliceHeight) / 2));
  screen[i].size(width / ray_number, sliceHeight);
  if (ray_y * 20 < 160){
    screen[i].style("background-color", color(118,25,51))
  }
  else {
    screen[i].style("background-color", color(158,65,54))
  }
}

function win(){
  a = createDiv("YOU WIN")
  a.position(300, 200)
  a.style("color", "aqua")
  a.style("font-size", "50px")
  a.style("z-index", "10")
  b = createDiv("PRESS ENTER TO RESTART")
  b.position(100, 600)
  b.style("color", "black")
  b.style("font-size", "50px")
  b.style("z-index", "10")
  game = false
  song.stop()
}
function lose(){
  a = createDiv("YOU LOSE")
  a.position(280, 200)
  a.style("color", "red")
  a.style("font-size", "50px")
  a.style("z-index", "10")
  b = createDiv("PRESS ENTER TO RESTART")
  b.position(100, 600)
  b.style("color", "black")
  b.style("font-size", "50px")
  b.style("z-index", "10")
  game = false
  song.stop()
}
