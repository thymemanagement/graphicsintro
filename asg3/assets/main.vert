attribute vec4 a_Position;
attribute vec4 a_Normal;
attribute vec2 a_UV;
uniform mat4 u_viewMatrix;
uniform mat4 u_projectionMatrix;
uniform mat4 u_orientMatrix;
uniform mat4 u_modelMatrix;
varying vec4 v_Normal;
varying vec2 v_UV;

void main() {
    gl_Position = u_projectionMatrix * u_viewMatrix * u_modelMatrix * a_Position;
    v_Normal = u_orientMatrix * a_Normal;
    v_UV = a_UV;
}