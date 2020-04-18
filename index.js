/**
 * cropper image
 *
 * @version 1.0.0
 */
(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    (global = global || self, global.CanvasImageCropper = factory());
}(this, (function () { 'use strict';

    /**
     * canvas 图片裁剪
     *
     * @author afu
     *
     * @param {Element} canvas
     * @param {Object} options
     */
    function ImageClip(options) {
        this.container = null;

        this.canvas = null;
        this.context = null;
        this.canvasZoomRatio = 1;

        // 图片信息
        this.image = null;
        this.originImageWidth = 0;
        this.originImageHeight = 0;
        this.zoomedImageWidth = 0;
        this.zoomedImageHeight = 0;
        this.imageZoomRatio = 1;

        // 裁剪移动信息
        this.inClipPath = false;
        this.beginMove = false;
        this.diffX = 0;
        this.diffY = 0;
        this.onChange = null;

        this.zoomedClipWidth = 0;
        this.zoomedClipHeight = 0;
        this.clipX = 0;
        this.clipY = 0;
        this.configs = {
            canvasWidth: 600,
            canvasHeight: 400,
            // 遮罩样式
            maskStyle: 'rgba(0, 0, 0, .6)',
            // 要裁剪的大小
            clipWidth: 100,
            clipHeight: 100
        };

        this.init(options);
    }
    ImageClip.prototype = {
        constructor: ImageClip,
        init: function(options) {
            if(undefined !== options) {
                for(var k in options) {
                    this.configs[k] = options[k];
                }
            }
        },
        isWideImage: function() {
            return this.originImageWidth >= this.originImageHeight;
        },


        drawImage: function() {
            // 宽图
            if(this.isWideImage()) {
                this.context.drawImage(
                    this.image,
                    0,
                    (this.canvas.height - this.zoomedImageHeight) / 2,
                    this.canvas.width,
                    this.zoomedImageHeight
                );

            } else {
                this.context.drawImage(
                    this.image,
                    (this.canvas.width - this.zoomedImageWidth) / 2,
                    0,
                    this.zoomedImageWidth,
                    this.canvas.height
                );
            }
        },
        renderCanvas: function() {
            this.context.save();

            // clear
            this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

            // background image
            this.drawImage();

            // mask
            this.context.fillStyle = this.configs.maskStyle;
            this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);

            // clip shape
            // clip 之后的内容只有在 clip 范围内才会显示
            this.context.beginPath();
            this.context.strokeStyle = 'rgb(255, 255, 255)';
            // this.context.setLineDash([2, 10]);
            this.context.rect(
                this.clipX,
                this.clipY,
                this.zoomedClipWidth,
                this.zoomedClipHeight);
            this.context.stroke();
            // this.context.closePath();

            // clip view area
            this.context.clip();

            // view image
            this.drawImage();

            this.context.restore();
        },


        // 移动相关
        checkPath: function(e) {
            var realOffsetX = e.offsetX / this.canvasZoomRatio;
            var realOffsetY = e.offsetY / this.canvasZoomRatio;

            if(realOffsetX > this.clipX && realOffsetX < this.clipX + this.zoomedClipWidth
                && realOffsetY > this.clipY && realOffsetY < this.clipY + this.zoomedClipHeight) {

                this.inClipPath = true;
                this.canvas.style.cursor = 'move';

                return;
            }

            this.inClipPath = false;
            this.canvas.style.cursor = 'default';
        },
        moveClip: function(e) {
            if(!this.beginMove || !this.inClipPath) {
                return;
            }

            this.clipX = e.offsetX - this.diffX;
            this.clipY = e.offsetY - this.diffY;

            // 限制裁剪移动区域
            var gap = 0;
            if(this.isWideImage()) {
                gap = (this.canvas.height - this.zoomedImageHeight) / 2;

                if(this.clipX <= 0) {
                    this.clipX = 0;
                }
                if(this.clipX + this.zoomedClipWidth >= this.canvas.width) {
                    this.clipX = this.canvas.width - this.zoomedClipWidth;
                }
                if(this.clipY <= gap) {
                    this.clipY = gap;
                }
                if(this.clipY + this.zoomedClipHeight + gap >= this.canvas.height) {
                    this.clipY = this.canvas.height - gap - this.zoomedClipHeight;
                }

            } else {
                gap = (this.canvas.width - this.zoomedImageWidth) / 2;

                if(this.clipX <= gap) {
                    this.clipX = gap;
                }
                if(this.clipX + this.zoomedClipWidth + gap >= this.canvas.width) {
                    this.clipX = this.canvas.width - gap - this.zoomedClipWidth;
                }
                if(this.clipY <= 0) {
                    this.clipY = 0;
                }
                if(this.clipY + this.zoomedClipHeight >= this.canvas.height) {
                    this.clipY = this.canvas.height - this.zoomedClipHeight;
                }
            }

            this.renderCanvas();

            if(null !== this.onChange) {
                this.onChange(this.getClipPosition());
            }
        },
        initCanvas: function() {
            this.canvas = this.container.ownerDocument.createElement('canvas');
            this.canvas.setAttribute('width', this.configs.canvasWidth);
            this.canvas.setAttribute('height', this.configs.canvasHeight);
            this.context = this.canvas.getContext('2d');

            this.container.appendChild(this.canvas);

            // 最终大小 / 实际大小
            this.canvasZoomRatio = this.canvas.clientWidth / this.canvas.width;
        },
        initImage: function(imageUrl) {
            var _self = this;

            this.image = new Image();
            this.image.onload = function() {
                // 原大小
                _self.originImageWidth = _self.image.width;
                _self.originImageHeight = _self.image.height;

                // 宽图按 canvas 宽度占满 可能导致小图被放大 Emmmmmm 写代码就是要为所欲为
                if(_self.isWideImage()) {
                    _self.zoomedImageWidth = _self.canvas.width;
                    _self.imageZoomRatio = _self.zoomedImageWidth / _self.originImageWidth;
                    _self.zoomedImageHeight = _self.originImageHeight * _self.imageZoomRatio;

                } else {
                    // 高图按高度占满
                    _self.zoomedImageHeight = _self.canvas.height;
                    _self.imageZoomRatio = _self.zoomedImageHeight / _self.originImageHeight;
                    _self.zoomedImageWidth = _self.originImageWidth * _self.imageZoomRatio;
                }

                // 裁剪区大小
                _self.zoomedClipWidth = _self.configs.clipWidth * _self.imageZoomRatio;
                _self.zoomedClipHeight = _self.configs.clipHeight * _self.imageZoomRatio;

                // 裁剪位置定位在中心
                _self.clipX = (_self.canvas.width - _self.zoomedClipWidth) / 2;
                _self.clipY = (_self.canvas.height - _self.zoomedClipHeight) / 2;

                // entry
                _self.renderCanvas();
            };
            this.image.src = imageUrl;
        },
        initEvent: function() {
            var _self = this;

            this.canvas.onmousemove = function(e) {
                _self.checkPath(e);
                _self.moveClip(e);
            };
            this.canvas.onmousedown = function(e) {
                // console.log(e);
                _self.beginMove = true;

                // offset 是相对 canvas 计算的
                // diffX 是相对值 所以就不进行缩放换算了
                _self.diffX = e.offsetX - _self.clipX;
                _self.diffY = e.offsetY - _self.clipY;
            };
            this.canvas.onmouseup = function(e) {
                _self.beginMove = false;
            };
        },

        /**
         * 裁剪图片
         *
         * @param {Element} container
         * @param {String} imageUrl
         */
        render: function(container, imageUrl) {
            this.container = container;

            this.initCanvas();
            this.initImage(imageUrl);
            this.initEvent();
        },

        /**
         * 获取裁剪位置信息
         */
        getClipPosition: function() {
            var wideImage = this.isWideImage();
            var gap = wideImage
                ? (this.canvas.height - this.zoomedImageHeight) / 2
                : (this.canvas.width - this.zoomedImageWidth) / 2;

            return wideImage
                ? {
                    x: this.clipX / this.imageZoomRatio,
                    y: (this.clipY - gap) / this.imageZoomRatio,
                    w: this.configs.clipWidth,
                    h: this.configs.clipHeight

                } : {
                    x: (this.clipX - gap) / this.imageZoomRatio,
                    y: this.clipY / this.imageZoomRatio,
                    w: this.configs.clipWidth,
                    h: this.configs.clipHeight
                };
        },

        /**
         * 获取裁剪预览
         */
        getPreview: function(type, encoderOptions) {
            var doc = this.canvas.ownerDocument;
            
            var pos = this.getClipPosition();
            var w = this.configs.clipWidth;
            var h = this.configs.clipHeight;
            var canvas = doc.createElement('canvas');
            var context = canvas.getContext('2d');

            canvas.width = w;
            canvas.height = h;
            context.drawImage(
                this.image,
                pos.x,
                pos.y,
                w,
                h,
                0,
                0,
                w,
                h
            );

            var base64 = canvas.toDataURL(type, encoderOptions);
            context = null;
            canvas = null;
            doc = null;

            return base64;
        },
        /**
         * 销毁
         */
        destroy: function() {
            this.canvas.onmousemove = null;
            this.canvas.onmousedown = null;
            this.canvas.onmouseup = null;

            this.context = null;
            this.canvas = null;
            this.image = null;

            this.onChange = null;

            this.doc = null;
        }
    };

    return ImageClip;

})));
