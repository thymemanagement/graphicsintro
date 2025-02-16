precision mediump float;
uniform vec4 u_lightSource;
uniform vec3 u_FragColor;
varying vec4 v_Normal;
varying vec2 v_UV;

void main() {
    float lightValue = max(dot(v_Normal, u_lightSource), 0.2);

    vec3 left = mix(vec3(1.0,1.0,1.0),vec3(0.0,0.0,0.0),v_UV[1]);
    vec3 right = mix(u_FragColor, vec3(0.0,0.0,0.0), v_UV[1]);
    gl_FragColor = vec4(lightValue * mix(left, right, v_UV[0]),1.0);
}