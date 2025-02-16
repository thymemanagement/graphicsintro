precision mediump float;
uniform vec4 u_lightSource;
uniform vec3 u_FragColor;
varying vec4 v_Normal;
varying vec2 v_UV;

void main() {
    lightValue = max(dot(v_Normal, u_lightSource), 0.2);

    gl_FragColor = vec4(lightValue * u_FragColor,1.0);
}