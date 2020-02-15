export default function(sketch) {
  return function ConvLayer(type, n_filters, kernel_shape, padding, activation, x, y, sizex, sizey) {
    this.type = type;
    this.n_filters = n_filters;
    this.kernel_shape = kernel_shape;
    this.padding = padding;
    this.activation = activation;

    this.x = x;
    this.y = y;
    this.sizex = sizex;
    this.sizey = sizey;
    this.radius = 4;
    this.button;

    this.returnData = function() {
      return {
        type: this.type,
        n_filters: this.n_filters,
        activation: this.activation,
        kernel_shape: this.kernel_shape,
        padding: this.padding
      };
    };

    this.propContent = function(ar) {
      const result = [];

      for (var i = 0; i < ar.length; i++) {
        const a = prompt(ar[i]);
        result.push({ [ar[i]]: a });
      }

      this.params = result;
    };

    this.rem = function() {
      if (this.button) {
        this.button.remove();
      }
    };

    this.display = function() {
      sketch.noStroke();

      sketch.fill(255, 255, 255);
      sketch.rect(this.x, this.y, this.sizex, this.sizey, this.radius);
      sketch.rect(
        this.x + this.sizex + 5,
        this.y + this.sizey / 4,
        this.sizex / 2,
        this.sizey / 2,
        this.radius
      );

      sketch.textSize(14);
      sketch.fill(255, 255, 255);
      sketch.text(
        this.params[0]["Layer Type"],
        this.x + this.sizex / 4,
        this.y - 2
      );
      sketch.text(
        this.params[2]["Activation Type"],
        this.x + this.sizex + this.sizex / 2,
        this.y - 2
      );
      this.button = sketch.createButton("edit");
      this.button.position(
        this.x + this.sizex / 2 + this.sizex / 3,
        this.y + this.sizey
      );
      this.button.mousePressed(changeBG);
    };

    function changeBG() {
      const a = prompt("hello");
    }
  };
}