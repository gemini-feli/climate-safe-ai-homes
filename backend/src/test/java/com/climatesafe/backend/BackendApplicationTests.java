package com.climatesafe.backend;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest(properties = {"openweather.api.key=dummy"})
class BackendApplicationTests {

	@Test
	void contextLoads() {
	}

}
