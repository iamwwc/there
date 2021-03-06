/* eslint-disable */
/* 
 * Hexojs will change single quote to "-" in tag.
 * So if tag contains single quote, router will miss and throw
 * exception
 * For example, in .md file, we have "let'sEncrypt" tag
 * tag path is "tags/let-sEncrypt" instead of "tags/let'sEncrypt"
 *
 * Don't use single quote in tag, use words instead symbol
 */

const app = `
  <div class="vue-app">
    <tag_cloud_links></tag_cloud_links>
    <router-view></router-view>
  </div>
  `;

const tag_cloud_links = {
	template: `
  <div class="tag-cloud-links">
    <router-link :to="{path:'/',query:{}}" class="tag-link">
      Show all
      <sup>
        {{all.length}}
      </sup>
    </router-link>
    <router-link v-for="(value,key) in tags"
      :key="key"
      :to="{path:'/',query:{tag:key}}"
      class="tag-link">
      {{ key }}
      <sup>
        {{value.length}}
      </sup>
    </router-link>
  </div>
   `,
	data() {
		return {
			tags: window.global.tags,
			all: window.global.all
		}
	}
};

const tag_cloud_view = {
	template: `
    <transition-group 
        tag="div" 
        class="tag-cloud-view"
        @before-enter="beforeEnter"
        @enter="enter"
        @leave="leave">
            <div v-for="item in toRender"
                class="tag-post"
                :key="window.id">
                <span class="post-meta">
                <span class="post-date">
                    {{item.date}}
                </span>
                </span>
                <a :href="item.path">
                    {{item.title}}
                </a>
            </div>
    </transition-group>
  `,
	data() {
		return {
			tags: window.global.tags,
			all: window.global.all,
			toRender: []
		};
	},
	watch: {
		"$route"(to, from) {
			if (Object.keys(to.query).length === 0) {
				this.toRender = this.changePostsId(this.all);
				return;
			}
			if (to.query.tag !== from.query.tag) {
				let changeId = this.tags[to.query.tag];
				this.toRender = this.changePostsId(changeId);
			}
		}
	},
	methods: {
		mergeArray(src) {
			return [].concat.apply([], src);
		},
		changePostsId(to) {
			// 因为vue会复用元素，所以为了使每次切换query都触发过渡动画，每次更新数据之前都更新一个id
			for (var i = 0; i < to.length; ++i) {
				to[i].id = ++window.id
			}
			return to
		},
		beforeEnter(el) {
			$(el).css({
				opacity: 0
			})
		},
		enter(el, done) {
			$(el).velocity("stop").velocity("transition.slideUpIn", {
				duration: 1000,
				easing: "easeIn",
				display: "flex"
			}, {
				complete: done
			})
		},
		leave(el, done) {
			done()
		}
	},
	mounted() {
		this.toRender = this.all;
		this.$router.onReady(() => {
			if (typeof this.$route.query.tag !== "undefined") {
				let tag = this.$route.query.tag;
				if (typeof this.tags[tag] === "undefined") {
					this.toRender = [];
					return;
				}
				this.toRender = this.tags[tag];
			}
		});
	}
};

var routes = [{
	path: "/",
	component: tag_cloud_view,
	props: (routes) => ({
		tag: routes.query.tag
	})
}];

const Router = new VueRouter({
	base: "/archives/",
	mode: "history",
	linkActiveClass: "",
	linkExactActiveClass: "active-tag",
	routes
});

Vue.component("app", app);
Vue.component("tag_cloud_links", tag_cloud_links);
Vue.component("tag_cloud_view", tag_cloud_view);

window.id = 0

Vue.config.devtools = true
new Vue({
	el: "#tags_cloud",
	router: Router,
	template: app,
	data() {
		return {
			tags: {},
			all: window.global
		};
	},
	created() {
		for (let i = 0; i < this.all.length; i++) {
			let post = this.all[i]
			let tagsOfPost = post.tags || []
			for (let j = 0; j < tagsOfPost.length; j++) {
				let tag = tagsOfPost[j]
				if (tag){
					this.tags[tag] = this.tags[tag] ? this.tags[tag].concat(post) : [].concat(post)
				}
			}
		}
		this.all.sort(function (a, b) {
			return new Date(b.date) - new Date(a.date);
		});
		window.global = {}
		window.global.tags = this.tags
		window.global.all = this.all
	}
});