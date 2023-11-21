"use strict";

var WebParametersControl = {
  init: function (element_id, configuration) {
    var that = this;
    this.configuration = JSON.parse(configuration);

    var unresolvedUrl = this.configuration.unresolvedUrl;
    var paramMatch = unresolvedUrl.match(/%(.+?)%/);
    var param = paramMatch ? paramMatch[1] : null;

    console.log({ element_id, configuration: this.configuration, param });

    // Listen for changes on all textarea elements
    $j(".paramValue textarea").change(function (event) {
        if (event.currentTarget.id.indexOf('parameter_' + param.replaceAll('.', '_')) > -1) {
            that.getOptions(unresolvedUrl.replace('%' + param + '%', event.currentTarget.value), element_id);
        }
    });
    this.decorateElement(element_id);
  },

  getOptions: function(url, element_id) {
    var that = this;
    url = url.replace('host.docker.internal', 'localhost');

    // Remove current options
    $j("#" + element_id)
        .find('option')
        .remove()
        .end()
        .append('<option value="loading">Loading options. Please wait...</option>')
        .val("loading");

    // disable field
    $j("#" + element_id).attr('disabled', true);

    // Set data attribute loading to true
    $j("#" + element_id).attr('data-loading', true);

    // disable run button <input type="submit" value="Run Build" class="btn btn_primary submitButton " id="runCustomBuildButton">
    $j("#runCustomBuildButton").attr('disabled', true);



    // do ajax call
    $j.ajax({
        url,
        type: this.configuration.method,
        dataType: "json",
        success: function(result) {
            // for debugging - log to console
            console.log(result);

            $j("#" + element_id)
                .find('option')
                .remove()
                .end();

            try {
                // Verify result
                if (!result.hasOwnProperty('options')) {
                    throw Error('Result from ' + url + ' has no options. - ' + JSON.stringify(result));
                }

                // Add all enabled options
                result.options.forEach(function(option) {
                    if (option.enabled) {
                        $j("#" + element_id).append('<option value="' + option.value + '">' + option.key + '</option>')
                    }
                });
            } finally {
                // re-enable field
                $j("#" + element_id).attr('disabled', false);
                $j("#" + element_id).attr('data-loading', false);

                // re-enable run button - if all web parameter fields are done loading
                if (!$j("[data-loading=true]").length) {
                    $j("#runCustomBuildButton").attr('disabled', false);
                }

                that.decorateElement(element_id);
            }


        },
        error: function(xhr,status,error) {
            console.error("An error occured fetching: ", url, "Status:", status, "Error: ", error);
        }
    })
  },
  decorateElement: function(element_id) {
      // Add Image options
      $j("#" + element_id).select2({
        templateResult: this.addOptionImage,
        templateSelection: this.addOptionImage,
      });
  },
  addOptionImage: function (opt) {
    if (!opt.id) {
      return opt.text;
    }
    var optimage = $j(opt.element).data("image");
    if (!optimage) {
      return opt.text;
    } else {
      return $j(
        '<span><img src="' +
          optimage +
          '" style="height:16px;" />' +
          $j(opt.element).text() +
          "</span>"
      );
    }
  },
};

//jQuery('textarea[id^="parameter_env_PLATFORM_BRANCH"]')
