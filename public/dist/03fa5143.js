var storySlider = function () {
    var i = $("#story__slider-preview"),
      t = $(".story-chitra__slider-nav");
    i.children().length <= 1 && t.hide();
    var e = {
        speed: 500,
        autoplay: !0,
        autoplaySpeed: 1e4,
        pauseOnFocus: !1,
        pauseOnHover: !1,
        touchThreshold: 5e3,
        swipeToSlide: !0,
        arrows: !1,
        dots: !0,
        adaptiveHeight: !1,
        fade: !0,
      },
      s = {
        ...e,
        appendDots: "#story__slider-dots",
        asNavFor: "#story__slider-caption",
      },
      a = { ...e, dots: !1, asNavFor: "#story__slider-preview", arrows: !1 };
    i.slick(s), $("#story__slider-caption").slick(a);
    var n = $(".story-chitra__slider-for");
    $(n).on("afterChange", function (i, t, e) {
      $(".story-chitra__slider-nav__item__manual").each(function () {
        var i = $(this).attr("data-slick-index");
        $(this).toggleClass("is-active", i == e);
      });
    });
  },
  resize_story_nav = function () {
    var i = $(".story__slider-preview");
    const t = $(window).width();
    let e, s;
    if (t < 560) {
      e = 320 * (t / 390);
    } else e = Math.min(450, i.width());
    (s = 0.5875 * e),
      i.find(".preview-wrap").each((i, t) => {
        $(t).css({ width: `${e}px`, height: `${s}px` });
      });
  };
$(".bank-btn-top").on("click", function () {
  const i = $(".bank-btn-top").index(this),
    t = $(".bank-item").eq(i),
    e = $(this).find(".ph-fill"),
    s = $(this);
  t.slideToggle(500),
    e.toggleClass("rotate"),
    s.toggleClass("active"),
    t.toggleClass("active");
}),
  $(".bank-item").each(function (i) {
    const t = $(".bank-btn-top").eq(i).find(".ph-fill"),
      e = $(".bank-btn-top").eq(i),
      s = $(this).is(":visible");
    t.toggleClass("rotate", s), e.toggleClass("active", s);
  });
var toggleGift = function () {
  $(".gift-form-sender-wrapper").slideToggle();
};
$(".wedding-gift__next").on("click", () => {
  $(".wedding-gift-details").css({ opacity: 0 }),
    $(".wedding-gift-picture").css({ opacity: 1 });
}),
  $(".wedding-gift__prev").on("click", () => {
    $(".wedding-gift-details").css({ opacity: 1 }),
      $(".wedding-gift-picture").css({ opacity: 0 });
  });
var init_gifts_slick = function () {
  var i = $(".hadiah-wrap");
  if (i.length) {
    var t = i.find(".hadiah-card-wrap"),
      e = t.length;
    t.each(function (i) {
      $(this).css("z-index", e - i);
    }),
      i
        .on("init", function () {
          $(".gifts__slider-nav__item__manual").eq(0).addClass("is-active");
        })
        .slick({
          infinite: !0,
          slidesToShow: 2,
          slidesToScroll: 1,
          dots: !1,
          arrows: !0,
          prevArrow: ".kado-chv.left",
          nextArrow: ".kado-chv.right",
        });
  }
};
$(document).ready(function () {
  if ((storySlider(), resize_story_nav(), $(".kado-wrapper")))
    var i = setInterval(function () {
      var t = $(".hadiah-wrap");
      t.length &&
        t.children().length > 0 &&
        (init_gifts_slick(), clearInterval(i));
    }, 500);
});
