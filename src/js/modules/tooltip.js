import tippy, {createSingleton} from "tippy.js"
export default function tooltip(node, params = {}) {
    // Determine the title to show. We want to prefer
    // 	the custom content passed in first, then the
    // HTML title attribute then the aria-label
    // in that order.

    const content = params.content
  
    // Let's make sure the "aria-label" attribute
    // is set so our element is accessible:
    // https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/ARIA_Techniques/Using_the_aria-label_attribute
 
  
    // Clear out the HTML title attribute since
    // we don't want the default behavior of it
    // showing up on hover.

  
    // Support any of the Tippy props by forwarding all "params":
    // https://atomiks.github.io/tippyjs/v6/all-props/
    const tip = tippy(node, { content, ...params });

    return {
      // If the props change, let's update the Tippy instance:
      update(newParams){tip.setProps({ content, ...params })},
  
      // Clean up the Tippy instance on unmount:
      destroy(){tip.destroy()}
    };
  };
  
  
  